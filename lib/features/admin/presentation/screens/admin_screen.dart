import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import 'package:csv/csv.dart';
import 'package:universal_html/html.dart' as html;
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:toastification/toastification.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:file_picker/file_picker.dart';

import '../../../../core/theme/design_system.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../candidature/data/candidature_repository.dart';
import '../../../candidature/models/candidature_model.dart';
import '../../../../core/localization/translation_provider.dart';

// Providers for dashboard state using NotifierProvider for Riverpod 3.0 compatibility
final candidaturesListProvider = FutureProvider<List<CandidatureModel>>((ref) async {
  final repository = ref.watch(candidatureRepositoryProvider);
  return repository.getCandidatures();
});

final statusFilterProvider = NotifierProvider<StatusFilterNotifier, String?>(() => StatusFilterNotifier());
class StatusFilterNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void update(String? val) => state = val;
}

final genderFilterProvider = NotifierProvider<GenderFilterNotifier, String?>(() => GenderFilterNotifier());
class GenderFilterNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void update(String? val) => state = val;
}

final searchQueryProvider = NotifierProvider<SearchQueryNotifier, String>(() => SearchQueryNotifier());
class SearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';
  void update(String val) => state = val;
}

// Elegant Mock Data for Skeletonizer loading state
final _mockCandidatures = List.generate(5, (index) => CandidatureModel(
  id: 'mock_$index',
  nomPrenom: 'John Doe Candidate Name',
  age: 25,
  sexe: 'Homme',
  quartier: 'Bastos, Yaoundé',
  reseauActif: 'TikTok',
  nombreAbonnes: '15,000',
  telephoneProche: '+237 699 999 999',
  whatsapp: '+237 699 999 999',
  applicationStatus: 'soumis',
  photoUrl: null,
  videoUrl: null,
));

class AdminScreen extends ConsumerWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncCandidatures = ref.watch(candidaturesListProvider);
    final selectedStatus = ref.watch(statusFilterProvider);
    final selectedGender = ref.watch(genderFilterProvider);
    final searchQuery = ref.watch(searchQueryProvider);
    final isMobile = MediaQuery.of(context).size.width < 1000;
    final trans = ref.watch(translationProvider);
    final lang = ref.watch(languageProvider);

    return Scaffold(
      backgroundColor: AppDesignSystem.backgroundAlt,
      appBar: AppBar(
        title: Text(
          trans.translate('admin_title'),
          style: AppDesignSystem.titleMedium.copyWith(color: AppDesignSystem.primary),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppDesignSystem.primary,
        elevation: 0.5,
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Center(
              child: GestureDetector(
                onTap: () => ref.read(languageProvider.notifier).toggleLanguage(),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppDesignSystem.primary.withOpacity(0.2)),
                    borderRadius: AppDesignSystem.borderSmall,
                  ),
                  child: Text(
                    lang == Language.fr ? 'FR 🇫🇷' : 'EN 🇬🇧',
                    style: AppDesignSystem.labelStyle.copyWith(
                      fontSize: 12,
                      color: AppDesignSystem.primary,
                    ),
                  ),
                ),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(candidaturesListProvider),
            tooltip: trans.translate('tooltip_refresh'),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
              context.go('/');
            },
            tooltip: trans.translate('tooltip_logout'),
          ),
        ],
      ),
      drawer: isMobile ? _buildDrawer(context, ref) : null,
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isMobile) _buildSidebar(context, ref),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // --- HEADER ACTIONNEURS ---
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        trans.translate('label_candidatures'), 
                        style: AppDesignSystem.titleLarge.copyWith(
                          color: AppDesignSystem.primary,
                          fontSize: 28,
                        ),
                      ),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          ElevatedButton.icon(
                            icon: const Icon(Icons.picture_as_pdf_rounded, size: 18),
                            label: Text(trans.translate('btn_pdf_report')),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppDesignSystem.error, 
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: AppDesignSystem.borderMedium),
                            ),
                            onPressed: () {
                              final currentData = ref.read(candidaturesListProvider).value;
                              if (currentData != null) _exportPdf(ref, currentData);
                            },
                          ),
                          ElevatedButton.icon(
                            icon: const Icon(Icons.table_chart_rounded, size: 18),
                            label: Text(trans.translate('btn_export_csv')),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppDesignSystem.success, 
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: AppDesignSystem.borderMedium),
                            ),
                            onPressed: () {
                              final currentData = ref.read(candidaturesListProvider).value;
                              if (currentData != null) _exportCsv(ref, currentData);
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                  AppDesignSystem.spacingLG(),

                  // --- ANALYTICS CHARTS ---
                  asyncCandidatures.when(
                    loading: () => const SizedBox.shrink(),
                    error: (_, __) => const SizedBox.shrink(),
                    data: (data) => _buildAnalyticsSection(context, ref, data, isMobile),
                  ),
                  AppDesignSystem.spacingLG(),

                  // --- BARRE DE FILTRES ---
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: AppDesignSystem.borderMedium,
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Wrap(
                        spacing: 16,
                        runSpacing: 12,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          SizedBox(
                            width: 240,
                            child: TextField(
                              decoration: InputDecoration(
                                hintText: trans.translate('hint_search_candidate'),
                                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                                border: const OutlineInputBorder(),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              ),
                              onChanged: (val) => ref.read(searchQueryProvider.notifier).update(val),
                            ),
                          ),
                          SizedBox(
                            width: 200,
                            child: DropdownButtonFormField<String?>(
                              initialValue: selectedStatus,
                              isExpanded: true,
                              isDense: true,
                              decoration: InputDecoration(
                                labelText: trans.translate('col_status'),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                border: const OutlineInputBorder(),
                              ),
                              onChanged: (val) => ref.read(statusFilterProvider.notifier).update(val),
                              items: [
                                DropdownMenuItem(value: null, child: Text(trans.translate('status_all'), overflow: TextOverflow.ellipsis)),
                                DropdownMenuItem(value: 'soumis', child: Text(trans.translate('status_submitted'), overflow: TextOverflow.ellipsis)),
                                DropdownMenuItem(value: 'en_revue', child: Text(trans.translate('status_under_review'), overflow: TextOverflow.ellipsis)),
                                DropdownMenuItem(value: 'preselectionne', child: Text(trans.translate('status_shortlisted'), overflow: TextOverflow.ellipsis)),
                                DropdownMenuItem(value: 'rejete', child: Text(trans.translate('status_rejected'), overflow: TextOverflow.ellipsis)),
                                DropdownMenuItem(value: 'retenu', child: Text(trans.translate('status_accepted'), overflow: TextOverflow.ellipsis)),
                              ],
                            ),
                          ),
                          SizedBox(
                            width: 170,
                            child: DropdownButtonFormField<String?>(
                              initialValue: selectedGender,
                              isExpanded: true,
                              isDense: true,
                              decoration: InputDecoration(
                                labelText: trans.translate('col_gender'),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                border: const OutlineInputBorder(),
                              ),
                              onChanged: (val) => ref.read(genderFilterProvider.notifier).update(val),
                              items: [
                                DropdownMenuItem(value: null, child: Text(trans.translate('gender_all'), overflow: TextOverflow.ellipsis)),
                                DropdownMenuItem(value: 'Homme', child: Text(trans.translate('gender_males'), overflow: TextOverflow.ellipsis)),
                                DropdownMenuItem(value: 'Femme', child: Text(trans.translate('gender_females'), overflow: TextOverflow.ellipsis)),
                              ],
                            ),
                          ),
                          if (selectedStatus != null || selectedGender != null || searchQuery.isNotEmpty)
                            TextButton.icon(
                              icon: const Icon(Icons.clear_all_rounded),
                              label: Text(trans.translate('btn_reset')),
                              style: TextButton.styleFrom(foregroundColor: AppDesignSystem.primary),
                              onPressed: () {
                                ref.read(statusFilterProvider.notifier).update(null);
                                ref.read(genderFilterProvider.notifier).update(null);
                                ref.read(searchQueryProvider.notifier).update('');
                              },
                            ),
                        ],
                      ),
                    ),
                  ),
                  AppDesignSystem.spacingMD(),

                  // --- LISTE / DATA TABLE (WITH SKELETONIZER LOADING STATE) ---
                  asyncCandidatures.when(
                    loading: () => Skeletonizer(
                      enabled: true,
                      child: _buildDataTable(context, ref, trans, lang, _mockCandidatures, false),
                    ),
                    error: (err, stack) => Card(
                      color: AppDesignSystem.error.withOpacity(0.06),
                      shape: RoundedRectangleBorder(
                        borderRadius: AppDesignSystem.borderMedium,
                        side: const BorderSide(color: AppDesignSystem.error),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Center(
                          child: Text(
                            'Erreur technique: $err',
                            style: AppDesignSystem.bodyMedium.copyWith(color: AppDesignSystem.error),
                          ),
                        ),
                      ),
                    ),
                    data: (candidatures) {
                      // Apply client-side filters
                      final filtered = candidatures.where((c) {
                        if (selectedStatus != null && c.applicationStatus != selectedStatus) return false;
                        if (selectedGender != null && c.sexe != selectedGender) return false;
                        if (searchQuery.isNotEmpty && !c.nomPrenom.toLowerCase().contains(searchQuery.toLowerCase())) return false;
                        return true;
                      }).toList();

                      if (filtered.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(48.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.filter_list_off_rounded, size: 64, color: Colors.grey),
                                AppDesignSystem.spacingMD(),
                                Text(
                                  trans.translate('err_no_matching_candidatures'), 
                                  style: AppDesignSystem.bodyMedium.copyWith(color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      return _buildDataTable(context, ref, trans, lang, filtered, true);
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable(
    BuildContext context, 
    WidgetRef ref, 
    TranslationService trans, 
    Language lang, 
    List<CandidatureModel> list,
    bool isActionable
  ) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: AppDesignSystem.borderLarge, 
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ClipRRect(
        borderRadius: AppDesignSystem.borderLarge,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(AppDesignSystem.primary.withOpacity(0.04)),
            headingRowHeight: 52,
            dataRowHeight: 64,
            columnSpacing: 16,
            horizontalMargin: 12,
            columns: [
              DataColumn(label: Text(trans.translate('col_name'), style: AppDesignSystem.labelStyle.copyWith(fontWeight: FontWeight.bold))),
              DataColumn(label: Text(trans.translate('col_age'), style: AppDesignSystem.labelStyle.copyWith(fontWeight: FontWeight.bold))),
              DataColumn(label: Text(trans.translate('col_gender'), style: AppDesignSystem.labelStyle.copyWith(fontWeight: FontWeight.bold))),
              DataColumn(label: Text(trans.translate('col_network'), style: AppDesignSystem.labelStyle.copyWith(fontWeight: FontWeight.bold))),
              DataColumn(label: Text(trans.translate('col_whatsapp'), style: AppDesignSystem.labelStyle.copyWith(fontWeight: FontWeight.bold))),
              DataColumn(label: Text(trans.translate('col_status'), style: AppDesignSystem.labelStyle.copyWith(fontWeight: FontWeight.bold))),
              DataColumn(label: Text(trans.translate('col_actions'), style: AppDesignSystem.labelStyle.copyWith(fontWeight: FontWeight.bold))),
            ],
            rows: list.map((c) => DataRow(
              cells: [
                DataCell(
                  SizedBox(
                    width: 160,
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppDesignSystem.primary.withOpacity(0.08),
                          radius: 16,
                          child: Text(
                            c.nomPrenom.isNotEmpty ? c.nomPrenom[0].toUpperCase() : '?',
                            style: AppDesignSystem.labelStyle.copyWith(color: AppDesignSystem.primary),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            c.nomPrenom,
                            style: AppDesignSystem.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                DataCell(Text('${c.age ?? "-"} ${lang == Language.fr ? 'ans' : 'years'}', style: AppDesignSystem.bodyMedium)),
                DataCell(Text(c.sexe == 'Homme' ? trans.translate('sex_male') : trans.translate('sex_female'), style: AppDesignSystem.bodyMedium)),
                DataCell(Text(c.reseauActif, style: AppDesignSystem.bodyMedium)),
                DataCell(Text(c.whatsapp, style: AppDesignSystem.bodyMedium)),
                DataCell(_buildStatusBadge(c.applicationStatus, trans)),
                DataCell(Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.rate_review_rounded, color: AppDesignSystem.primary),
                      tooltip: trans.translate('tooltip_evaluate'),
                      onPressed: isActionable ? () => _showReviewDialog(context, ref, c) : null,
                    ),
                    if (c.photoUrl != null)
                      IconButton(
                        icon: const Icon(Icons.image_rounded, color: AppDesignSystem.japapBlue),
                        tooltip: trans.translate('tooltip_photo'),
                        onPressed: isActionable ? () => _launchUrl(c.photoUrl!) : null,
                      ),
                    if (c.videoUrl != null)
                      IconButton(
                        icon: const Icon(Icons.videocam_rounded, color: AppDesignSystem.error),
                        tooltip: trans.translate('tooltip_video'),
                        onPressed: isActionable ? () => _launchUrl(c.videoUrl!) : null,
                      ),
                  ],
                )),
              ],
            )).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildAnalyticsSection(BuildContext context, WidgetRef ref, List<CandidatureModel> candidatures, bool isMobile) {
    // 1. Calculate Gender count
    int males = candidatures.where((c) => c.sexe == 'Homme').length;
    int females = candidatures.where((c) => c.sexe == 'Femme').length;
    int total = candidatures.length;

    double malePercent = total > 0 ? (males / total) * 100 : 0;
    double femalePercent = total > 0 ? (females / total) * 100 : 0;

    // 2. Calculate Network Counts
    Map<String, int> networkCounts = {};
    for (var c in candidatures) {
      final key = c.reseauActif.trim().toLowerCase();
      if (key.isNotEmpty) {
        networkCounts[c.reseauActif] = (networkCounts[c.reseauActif] ?? 0) + 1;
      }
    }
    
    // Sort and get top networks
    final sortedNetworks = networkCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topNetworks = sortedNetworks.take(4).toList();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Flex(
        direction: isMobile ? Axis.vertical : Axis.horizontal,
        children: [
          // Genders Distribution PieChart
          Expanded(
            flex: isMobile ? 0 : 1,
            child: Container(
              height: 240,
              margin: EdgeInsets.only(bottom: isMobile ? 16 : 0, right: isMobile ? 0 : 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: AppDesignSystem.borderLarge,
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: PieChart(
                      PieChartData(
                        sectionsSpace: 4,
                        centerSpaceRadius: 40,
                        sections: [
                          PieChartSectionData(
                            color: AppDesignSystem.primary,
                            value: males.toDouble(),
                            title: '${malePercent.toStringAsFixed(0)}%',
                            radius: 50,
                            titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          PieChartSectionData(
                            color: AppDesignSystem.japapBlue,
                            value: females.toDouble(),
                            title: '${femalePercent.toStringAsFixed(0)}%',
                            radius: 50,
                            titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Genders', style: AppDesignSystem.titleSmall),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Container(width: 12, height: 12, color: AppDesignSystem.primary),
                          const SizedBox(width: 8),
                          Text('Males ($males)', style: AppDesignSystem.bodyMedium),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(width: 12, height: 12, color: AppDesignSystem.japapBlue),
                          const SizedBox(width: 8),
                          Text('Females ($females)', style: AppDesignSystem.bodyMedium),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          // Networks Active BarChart
          Expanded(
            flex: isMobile ? 0 : 1,
            child: Container(
              height: 240,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: AppDesignSystem.borderLarge,
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Top Active Networks', style: AppDesignSystem.titleSmall),
                  const SizedBox(height: 16),
                  Expanded(
                    child: BarChart(
                      BarChartData(
                        borderData: FlBorderData(show: false),
                        gridData: const FlGridData(show: false),
                        titlesData: FlTitlesData(
                          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                int index = value.toInt();
                                if (index >= 0 && index < topNetworks.length) {
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 6.0),
                                    child: Text(
                                      topNetworks[index].key,
                                      style: AppDesignSystem.bodySmall.copyWith(fontSize: 10),
                                    ),
                                  );
                                }
                                return const SizedBox();
                              },
                            ),
                          ),
                        ),
                        barGroups: List.generate(topNetworks.length, (index) {
                          return BarChartGroupData(
                            x: index,
                            barRods: [
                              BarChartRodData(
                                toY: topNetworks[index].value.toDouble(),
                                color: AppDesignSystem.primary,
                                width: 22,
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                              )
                            ],
                          );
                        }),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status, TranslationService trans) {
    Color bg = Colors.grey.shade100;
    Color fg = Colors.grey.shade700;
    String text = status.toUpperCase();

    switch (status) {
      case 'soumis':
        bg = AppDesignSystem.japapBlue.withOpacity(0.08);
        fg = AppDesignSystem.japapBlue;
        text = trans.translate('status_submitted').toUpperCase();
        break;
      case 'en_revue':
        bg = AppDesignSystem.warning.withOpacity(0.08);
        fg = AppDesignSystem.warning;
        text = trans.translate('status_under_review').toUpperCase();
        break;
      case 'preselectionne':
        bg = AppDesignSystem.primaryLight.withOpacity(0.08);
        fg = AppDesignSystem.primaryLight;
        text = trans.translate('status_shortlisted').toUpperCase();
        break;
      case 'rejete':
        bg = AppDesignSystem.error.withOpacity(0.08);
        fg = AppDesignSystem.error;
        text = trans.translate('status_rejected').toUpperCase();
        break;
      case 'retenu':
        bg = AppDesignSystem.success.withOpacity(0.08);
        fg = AppDesignSystem.success;
        text = trans.translate('status_accepted').toUpperCase();
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: AppDesignSystem.borderSmall,
      ),
      child: Text(
        text,
        style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  // --- BOÎTE DE DIALOGUE DE DÉCISION ET ÉVALUATION ---
  void _showReviewDialog(BuildContext context, WidgetRef ref, CandidatureModel candidature) {
    String currentStatus = candidature.applicationStatus;
    String comment = '';
    String? currentPhotoUrl = candidature.photoUrl;
    String? currentVideoUrl = candidature.videoUrl;
    bool isUploadingPhoto = false;
    bool isUploadingVideo = false;
    final trans = ref.read(translationProvider);
    final lang = ref.read(languageProvider);
    final repo = ref.read(candidatureRepositoryProvider);

    Future<void> replaceFile(String fileType, void Function(void Function()) setState, BuildContext ctx) async {
      final allowed = fileType == 'photo'
          ? const {'jpg', 'jpeg', 'png', 'webp', 'heic'}
          : const {'mp4', 'mov', 'avi', 'mkv', 'webm'};
      final result = await FilePicker.pickFiles(
        type: fileType == 'photo' ? FileType.image : FileType.video,
        withData: true,
        allowMultiple: false,
      );
      if (result == null) return;
      final file = result.files.single;
      final ext = file.name.split('.').last.toLowerCase();
      if (!allowed.contains(ext)) {
        toastification.show(
          context: ctx,
          type: ToastificationType.error,
          style: ToastificationStyle.flatColored,
          title: Text(trans.translate('err_file_bad_ext')),
          autoCloseDuration: const Duration(seconds: 4),
        );
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toastification.show(
          context: ctx,
          type: ToastificationType.error,
          style: ToastificationStyle.flatColored,
          title: Text(trans.translate('err_file_too_large')),
          autoCloseDuration: const Duration(seconds: 4),
        );
        return;
      }

      setState(() {
        if (fileType == 'photo') { isUploadingPhoto = true; }
        else { isUploadingVideo = true; }
      });

      try {
        final newUrl = await repo.updateFile(
          applicationId: candidature.id!,
          fileType: fileType,
          file: file,
        );
        setState(() {
          if (fileType == 'photo') { currentPhotoUrl = newUrl; isUploadingPhoto = false; }
          else { currentVideoUrl = newUrl; isUploadingVideo = false; }
        });
        ref.invalidate(candidaturesListProvider);
        if (ctx.mounted) {
          toastification.show(
            context: ctx,
            type: ToastificationType.success,
            style: ToastificationStyle.flatColored,
            title: Text(fileType == 'photo' ? 'Photo mise à jour ✓' : 'Vidéo mise à jour ✓'),
            autoCloseDuration: const Duration(seconds: 3),
          );
        }
      } catch (e) {
        setState(() {
          if (fileType == 'photo') { isUploadingPhoto = false; }
          else { isUploadingVideo = false; }
        });
        if (ctx.mounted) {
          toastification.show(
            context: ctx,
            type: ToastificationType.error,
            style: ToastificationStyle.flatColored,
            title: Text('${trans.translate('toast_update_error')}$e'),
            autoCloseDuration: const Duration(seconds: 4),
          );
        }
      }
    }

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: AppDesignSystem.borderLarge),
              title: Row(
                children: [
                  const Icon(Icons.rate_review_rounded, color: AppDesignSystem.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      trans.translate('dialog_evaluation_title') + candidature.nomPrenom,
                      style: AppDesignSystem.titleMedium,
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: SizedBox(
                  width: 560,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // ── Infos candidat ───────────────────────────────────
                      Text(
                        '${lang == Language.fr ? 'Âge : ' : 'Age: '}${candidature.age ?? "-"} ${lang == Language.fr ? 'ans' : 'years'} | ${lang == Language.fr ? 'Sexe : ' : 'Gender: '}${candidature.sexe == 'Homme' ? trans.translate('sex_male') : trans.translate('sex_female')}',
                        style: AppDesignSystem.bodyMedium.copyWith(color: AppDesignSystem.textSecondary),
                      ),
                      Text(
                        '${lang == Language.fr ? 'Quartier : ' : 'Neighborhood: '}${candidature.quartier}',
                        style: AppDesignSystem.bodyMedium.copyWith(color: AppDesignSystem.textSecondary),
                      ),
                      Text(
                        '${lang == Language.fr ? 'Réseau : ' : 'Network: '}${candidature.reseauActif} (${candidature.nombreAbonnes})',
                        style: AppDesignSystem.bodyMedium.copyWith(color: AppDesignSystem.textSecondary),
                      ),
                      if (candidature.lienReseau != null && candidature.lienReseau!.isNotEmpty)
                        GestureDetector(
                          onTap: () => _launchUrl(candidature.lienReseau!),
                          child: Row(
                            children: [
                              const Icon(Icons.link_rounded, size: 14, color: AppDesignSystem.japapBlue),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  candidature.lienReseau!,
                                  style: AppDesignSystem.bodyMedium.copyWith(
                                    color: AppDesignSystem.japapBlue,
                                    decoration: TextDecoration.underline,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      const Divider(height: 24),

                      // ── Médias ───────────────────────────────────────────
                      Text(lang == Language.fr ? 'MÉDIAS' : 'MEDIA', style: AppDesignSystem.labelStyle),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          // Photo inline
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Photo', style: AppDesignSystem.labelStyle),
                                const SizedBox(height: 6),
                                if (isUploadingPhoto)
                                  const SizedBox(height: 80, child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
                                else if (currentPhotoUrl != null)
                                  Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: AppDesignSystem.borderMedium,
                                        child: Image.network(currentPhotoUrl!, height: 120, width: double.infinity, fit: BoxFit.cover),
                                      ),
                                      Positioned(top: 4, right: 4, child: Row(
                                        children: [
                                          _MediaActionBtn(icon: Icons.open_in_new_rounded, tooltip: 'Voir', onTap: () => _launchUrl(currentPhotoUrl!)),
                                          const SizedBox(width: 4),
                                          _MediaActionBtn(icon: Icons.download_rounded, tooltip: 'Télécharger', onTap: () => _launchUrl('${currentPhotoUrl!}&download=true')),
                                          const SizedBox(width: 4),
                                          _MediaActionBtn(icon: Icons.swap_horiz_rounded, tooltip: 'Remplacer', onTap: () => replaceFile('photo', setState, ctx)),
                                        ],
                                      )),
                                    ],
                                  )
                                else
                                  OutlinedButton.icon(onPressed: () => replaceFile('photo', setState, ctx), icon: const Icon(Icons.upload_rounded, size: 16), label: const Text('Ajouter')),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Vidéo inline
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Vidéo', style: AppDesignSystem.labelStyle),
                                const SizedBox(height: 6),
                                if (isUploadingVideo)
                                  const SizedBox(height: 80, child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
                                else if (currentVideoUrl != null)
                                  Container(
                                    height: 120,
                                    decoration: BoxDecoration(color: Colors.black87, borderRadius: AppDesignSystem.borderMedium),
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                                          _MediaActionBtn(icon: Icons.play_circle_outline_rounded, tooltip: 'Lire', onTap: () => _launchUrl(currentVideoUrl!)),
                                          const SizedBox(width: 8),
                                          _MediaActionBtn(icon: Icons.download_rounded, tooltip: 'Télécharger', onTap: () => _launchUrl('${currentVideoUrl!}&download=true')),
                                          const SizedBox(width: 8),
                                          _MediaActionBtn(icon: Icons.swap_horiz_rounded, tooltip: 'Remplacer', onTap: () => replaceFile('video', setState, ctx)),
                                        ]),
                                      ],
                                    ),
                                  )
                                else
                                  OutlinedButton.icon(onPressed: () => replaceFile('video', setState, ctx), icon: const Icon(Icons.upload_rounded, size: 16), label: const Text('Ajouter')),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),

                      // ── Statut ───────────────────────────────────────────
                      Text(trans.translate('dialog_change_status'), style: AppDesignSystem.labelStyle),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: currentStatus,
                        decoration: const InputDecoration(border: OutlineInputBorder()),
                        items: [
                          DropdownMenuItem(value: 'soumis', child: Text(trans.translate('status_submitted'))),
                          DropdownMenuItem(value: 'en_revue', child: Text(trans.translate('status_under_review'))),
                          DropdownMenuItem(value: 'preselectionne', child: Text(trans.translate('status_shortlisted'))),
                          DropdownMenuItem(value: 'rejete', child: Text(trans.translate('status_rejected'))),
                          DropdownMenuItem(value: 'retenu', child: Text(trans.translate('status_accepted'))),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => currentStatus = val);
                        },
                      ),
                      const SizedBox(height: 16),

                      // ── Commentaire ──────────────────────────────────────
                      Text(trans.translate('dialog_add_note'), style: AppDesignSystem.labelStyle),
                      const SizedBox(height: 8),
                      TextField(
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: trans.translate('dialog_note_hint'),
                          border: const OutlineInputBorder(),
                        ),
                        onChanged: (val) => comment = val,
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                // ── Bouton WhatsApp ──────────────────────────────
                IconButton(
                  tooltip: 'Contacter sur WhatsApp',
                  icon: const Icon(Icons.chat_rounded, color: Color(0xFF25D366)),
                  onPressed: () {
                    final phone = candidature.whatsapp.replaceAll(RegExp(r'[\s\-\(\)]'), '');
                    final formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
                    final msg = switch (currentStatus) {
                      'preselectionne' => 'Bonjour ${candidature.nomPrenom}, félicitations ! Vous êtes présélectionné(e) pour Voice Talents Saison 1. Notre équipe vous contactera prochainement.',
                      'retenu'         => 'Bonjour ${candidature.nomPrenom}, félicitations ! Vous êtes officiellement retenu(e) pour Voice Talents Saison 1 🎉 Bienvenue dans l\'aventure !',
                      'rejete'         => 'Bonjour ${candidature.nomPrenom}, merci pour votre candidature à Voice Talents. Nous avons bien étudié votre profil mais ne pouvons pas y donner suite cette fois. Bonne continuation !',
                      'en_revue'       => 'Bonjour ${candidature.nomPrenom}, votre candidature Voice Talents est en cours d\'examen par notre équipe. Nous revenons vers vous très prochainement.',
                      _                => 'Bonjour ${candidature.nomPrenom}, nous avons bien reçu votre candidature Voice Talents Saison 1. Merci !',
                    };
                    final url = Uri.parse('https://wa.me/$formattedPhone?text=${Uri.encodeComponent(msg)}');
                    _launchUrl(url.toString());
                  },
                ),
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: Text(trans.translate('btn_cancel'),
                      style: TextStyle(color: AppDesignSystem.textSecondary)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    try {
                      await repo.updateStatus(candidature.id!, currentStatus, comment: comment);
                      ref.invalidate(candidaturesListProvider);
                      if (context.mounted) {
                        toastification.show(
                          context: context,
                          type: ToastificationType.success,
                          style: ToastificationStyle.flatColored,
                          title: Text(trans.translate('toast_eval_saved')),
                          autoCloseDuration: const Duration(seconds: 4),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        toastification.show(
                          context: context,
                          type: ToastificationType.error,
                          style: ToastificationStyle.flatColored,
                          title: Text('${trans.translate('toast_update_error')}$e'),
                          autoCloseDuration: const Duration(seconds: 4),
                        );
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppDesignSystem.primary),
                  child: Text(trans.translate('btn_save')),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildSidebar(BuildContext context, WidgetRef ref) {
    final trans = ref.watch(translationProvider);
    return Container(
      width: 260,
      height: MediaQuery.of(context).size.height - kToolbarHeight,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(right: BorderSide(color: Colors.grey.shade100)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppDesignSystem.primary.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.admin_panel_settings_rounded, size: 48, color: AppDesignSystem.primary),
          ),
          const SizedBox(height: 16),
          Text(
            trans.translate('sidebar_title'), 
            style: AppDesignSystem.titleSmall.copyWith(fontWeight: FontWeight.bold),
          ),
          const Divider(height: 48),
          ListTile(
            leading: const Icon(Icons.people_alt_rounded, color: AppDesignSystem.primary),
            title: Text(
              trans.translate('sidebar_candidatures'), 
              style: AppDesignSystem.labelStyle.copyWith(color: AppDesignSystem.primary, fontWeight: FontWeight.bold),
            ),
            selected: true,
            selectedTileColor: AppDesignSystem.primary.withOpacity(0.06),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.settings_suggest_rounded, color: AppDesignSystem.textSecondary),
            title: Text(
              trans.translate('sidebar_settings'),
              style: AppDesignSystem.bodyMedium.copyWith(color: AppDesignSystem.textSecondary),
            ),
            onTap: () {
              toastification.show(
                context: context,
                type: ToastificationType.info,
                style: ToastificationStyle.flatColored,
                title: Text(trans.translate('toast_settings_op')),
                autoCloseDuration: const Duration(seconds: 3),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, WidgetRef ref) {
    return Drawer(
      child: SafeArea(
        child: _buildSidebar(context, ref),
      ),
    );
  }

  // --- EXPORTS DE DONNÉES ---
  void _exportCsv(WidgetRef ref, List<CandidatureModel> candidatures) {
    final trans = ref.read(translationProvider);
    final lang = ref.read(languageProvider);
    List<List<dynamic>> rows = [
      [
        trans.translate('col_name'),
        trans.translate('col_age'),
        trans.translate('col_gender'),
        trans.translate('col_network'),
        trans.translate('label_followers'),
        lang == Language.fr ? 'Téléphone Proche' : 'Relative\'s Phone Number',
        lang == Language.fr ? 'Quartier' : 'Neighborhood',
        trans.translate('col_whatsapp'),
        trans.translate('col_status'),
        'Vidéo URL',
        'Photo URL'
      ]
    ];
    for (var c in candidatures) {
      rows.add([
        c.nomPrenom,
        c.age ?? '',
        c.sexe == 'Homme' ? trans.translate('sex_male') : trans.translate('sex_female'),
        c.reseauActif,
        c.nombreAbonnes,
        c.telephoneProche,
        c.quartier,
        c.whatsapp,
        trans.translate('status_${c.applicationStatus == 'soumis' ? 'submitted' : c.applicationStatus == 'en_revue' ? 'under_review' : c.applicationStatus == 'preselectionne' ? 'shortlisted' : c.applicationStatus == 'rejete' ? 'rejected' : 'accepted'}'),
        c.videoUrl ?? '',
        c.photoUrl ?? ''
      ]);
    }
    String csvString = csv.encode(rows);
    final bytes = utf8.encode(csvString);
    final blob = html.Blob([bytes]);
    final url = html.Url.createObjectUrlFromBlob(blob);
    final anchor = html.document.createElement('a') as html.AnchorElement
      ..href = url
      ..style.display = 'none'
      ..download = 'candidatures_v2_export.csv';
    html.document.body!.children.add(anchor);
    anchor.click();
    html.document.body!.children.remove(anchor);
    html.Url.revokeObjectUrl(url);
  }

  Future<void> _exportPdf(WidgetRef ref, List<CandidatureModel> candidatures) async {
    final trans = ref.read(translationProvider);
    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        build: (context) => [
          pw.Header(level: 0, child: pw.Text(trans.translate('pdf_title'))),
          pw.Table.fromTextArray(
            context: context,
            data: <List<String>>[
              <String>[
                trans.translate('col_name'),
                trans.translate('col_age'),
                trans.translate('col_gender'),
                trans.translate('col_network'),
                trans.translate('col_whatsapp'),
                trans.translate('col_status')
              ],
              ...candidatures.map((c) => [
                c.nomPrenom,
                c.age?.toString() ?? '-',
                c.sexe == 'Homme' ? trans.translate('sex_male') : trans.translate('sex_female'),
                c.reseauActif,
                c.whatsapp,
                trans.translate('status_${c.applicationStatus == 'soumis' ? 'submitted' : c.applicationStatus == 'en_revue' ? 'under_review' : c.applicationStatus == 'preselectionne' ? 'shortlisted' : c.applicationStatus == 'rejete' ? 'rejected' : 'accepted'}').toUpperCase()
              ])
            ],
          ),
        ],
      ),
    );

    await Printing.sharePdf(bytes: await pdf.save(), filename: 'candidatures_v2.pdf');
  }
}

class _MediaActionBtn extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  const _MediaActionBtn({required this.icon, required this.tooltip, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.black54,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(icon, size: 16, color: Colors.white),
        ),
      ),
    );
  }
}
