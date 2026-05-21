import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../adapters/in/candidature_notifier.dart';
import '../../../../core/theme/design_system.dart';
import '../../../../core/localization/translation_provider.dart';

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({super.key});

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  final _idController = TextEditingController();
  bool _isLoading = false;
  Map<String, dynamic>? _trackingData;
  String? _errorMessage;

  @override
  void dispose() {
    _idController.dispose();
    super.dispose();
  }

  Future<void> _fetchTracking() async {
    final appId = _idController.text.trim();
    final trans = ref.read(translationProvider);
    if (appId.isEmpty) {
      setState(() {
        _errorMessage = trans.translate('err_enter_id');
        _trackingData = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final useCase = ref.read(trackCandidatureStatusUseCaseProvider);
      final data = await useCase.execute(appId);
      setState(() {
        _trackingData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = trans.translate('err_id_not_found');
        _trackingData = null;
        _isLoading = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'soumis':
        return AppDesignSystem.japapBlue;
      case 'en_revue':
        return AppDesignSystem.warning;
      case 'preselectionne':
        return AppDesignSystem.primaryLight;
      case 'rejete':
        return AppDesignSystem.error;
      case 'retenu':
        return AppDesignSystem.success;
      default:
        return AppDesignSystem.textSecondary;
    }
  }

  String _getStatusLabel(String status, TranslationService trans) {
    switch (status) {
      case 'soumis':
        return trans.translate('status_submitted');
      case 'en_revue':
        return trans.translate('status_under_review');
      case 'preselectionne':
        return trans.translate('status_shortlisted');
      case 'rejete':
        return trans.translate('status_rejected');
      case 'retenu':
        return trans.translate('status_accepted');
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final trans = ref.watch(translationProvider);
    
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header back to home
                IconButton(
                  icon: const Icon(Icons.arrow_back_rounded, color: Colors.white70),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                AppDesignSystem.spacingMD(),
                
                // Title
                Text(
                  trans.translate('track_title'),
                  style: AppDesignSystem.titleLarge.copyWith(
                    color: Colors.white,
                  ),
                ),
                AppDesignSystem.spacingSM(),
                Text(
                  trans.translate('track_subtitle'),
                  style: AppDesignSystem.bodyMedium.copyWith(
                    color: Colors.white70,
                  ),
                ),
                AppDesignSystem.spacingXL(),

                // Search Panel (Glassmorphism)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: AppDesignSystem.borderLarge,
                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _idController,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText: trans.translate('hint_candidate_id'),
                            hintStyle: const TextStyle(color: Colors.white38),
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            errorBorder: InputBorder.none,
                            focusedErrorBorder: InputBorder.none,
                            fillColor: Colors.transparent,
                            filled: false,
                            icon: const Icon(Icons.search_rounded, color: AppDesignSystem.primaryLight),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _fetchTracking,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppDesignSystem.primaryLight,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: AppDesignSystem.borderMedium,
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation(Colors.white),
                                ),
                              )
                            : Text(
                                trans.translate('btn_search'),
                                style: AppDesignSystem.buttonText.copyWith(fontSize: 14),
                              ),
                      ),
                    ],
                  ),
                ),
                AppDesignSystem.spacingMD(),
                
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: AppDesignSystem.error, fontWeight: FontWeight.bold),
                    ),
                  ),
                
                AppDesignSystem.spacingXL(),

                // Tracking content
                if (_trackingData != null) ...[
                  // Real-time Status Card
                  _buildStatusCard(trans),
                  AppDesignSystem.spacingLG(),
                  
                  // Interactive timeline
                  Text(
                    trans.translate('label_evaluation_history'),
                    style: AppDesignSystem.titleMedium.copyWith(
                      color: Colors.white,
                    ),
                  ),
                  AppDesignSystem.spacingMD(),
                  _buildTimeline(trans),
                  
                  AppDesignSystem.spacingXL(),
                  
                  // WhatsApp Logs Card
                  Text(
                    trans.translate('label_whatsapp_notifications'),
                    style: AppDesignSystem.titleMedium.copyWith(
                      color: Colors.white,
                    ),
                  ),
                  AppDesignSystem.spacingMD(),
                  _buildWhatsAppLogs(trans),
                ]
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusCard(TranslationService trans) {
    final history = _trackingData!['status_history'] as List;
    final currentStatus = history.isNotEmpty ? history.last['new_status'] : 'soumis';
    final statusColor = _getStatusColor(currentStatus);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [statusColor.withOpacity(0.12), Colors.white.withOpacity(0.01)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: AppDesignSystem.borderExtraLarge,
        border: Border.all(color: statusColor.withOpacity(0.25)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.analytics_rounded, color: statusColor, size: 32),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  trans.translate('label_current_status'),
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  _getStatusLabel(currentStatus, trans),
                  style: AppDesignSystem.titleLarge.copyWith(
                    color: statusColor,
                    fontSize: 22,
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildTimeline(TranslationService trans) {
    final history = _trackingData!['status_history'] as List;

    if (history.isEmpty) {
      return Text(
        trans.translate('no_history'),
        style: AppDesignSystem.bodyMedium.copyWith(color: Colors.white38),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: history.length,
      itemBuilder: (context, index) {
        final step = history[index];
        final String newStatus = step['new_status'];
        final String? comment = step['comment'];
        final String rawDate = step['created_at'];
        final date = DateTime.parse(rawDate);
        final statusColor = _getStatusColor(newStatus);

        return IntrinsicHeight(
          child: Row(
            children: [
              Column(
                children: [
                  Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      color: statusColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: statusColor.withOpacity(0.4),
                          blurRadius: 8,
                        )
                      ]
                    ),
                  ),
                  Expanded(
                    child: index == history.length - 1
                        ? const SizedBox()
                        : Container(
                            width: 2,
                            color: Colors.white12,
                          ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _getStatusLabel(newStatus, trans),
                            style: AppDesignSystem.titleSmall.copyWith(
                              color: statusColor,
                            ),
                          ),
                          Text(
                            "${date.day}/${date.month} à ${date.hour}h${date.minute.toString().padLeft(2, '0')}",
                            style: AppDesignSystem.bodySmall.copyWith(color: Colors.white38),
                          ),
                        ],
                      ),
                      if (comment != null && comment.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.02),
                            borderRadius: AppDesignSystem.borderMedium,
                            border: Border.all(color: Colors.white.withOpacity(0.04)),
                          ),
                          child: Text(
                            comment,
                            style: AppDesignSystem.bodyMedium.copyWith(
                              color: Colors.white70,
                              fontStyle: FontStyle.italic,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ]
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWhatsAppLogs(TranslationService trans) {
    final logs = _trackingData!['whatsapp_notifications'] as List;

    if (logs.isEmpty) {
      return Text(
        trans.translate('no_whatsapp_logs'),
        style: AppDesignSystem.bodyMedium.copyWith(color: Colors.white38),
      );
    }

    return Column(
      children: logs.map((log) {
        final String body = log['message_body'];
        final String status = log['delivery_status'];
        final String rawDate = log['created_at'];
        final date = DateTime.parse(rawDate);

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.02),
            borderRadius: AppDesignSystem.borderMedium,
            border: Border.all(color: Colors.white.withOpacity(0.04)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.chat_bubble_outline_rounded, color: AppDesignSystem.success, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        "WhatsApp - ${status.toUpperCase()}",
                        style: AppDesignSystem.labelStyle.copyWith(
                          color: AppDesignSystem.success,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    "${date.day}/${date.month} à ${date.hour}h${date.minute.toString().padLeft(2, '0')}",
                    style: AppDesignSystem.bodySmall.copyWith(color: Colors.white38, fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                body,
                style: AppDesignSystem.bodyMedium.copyWith(
                  color: Colors.white70,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
