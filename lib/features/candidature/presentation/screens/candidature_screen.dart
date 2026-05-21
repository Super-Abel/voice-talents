import '../../domain/entities/custom_response.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/utils/app_constants.dart';
import '../../../../core/assets/app_assets.dart';
import '../../../../core/utils/dialogs.dart';

import '../../../../core/theme/design_system.dart';
import '../../../../core/utils/validators.dart';
import '../../domain/entities/custom_field.dart';
import '../../domain/entities/candidature.dart';
import '../../adapters/in/candidature_notifier.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_dropdown.dart';
import '../widgets/file_upload_widget.dart';
import '../widgets/city_quartier_field.dart';

class CandidatureScreen extends ConsumerStatefulWidget {
  const CandidatureScreen({super.key});

  @override
  ConsumerState<CandidatureScreen> createState() => _CandidatureScreenState();
}

class _CandidatureScreenState extends ConsumerState<CandidatureScreen> {
  int _currentStep = 0;
  bool _isSubmitting = false;
  List<CustomField> _customFields = [];
  bool _isLoadingFields = true;
  String? _videoError;
  String? _photoError;

  // Clés de validation indépendantes pour chaque étape
  final List<GlobalKey<FormState>> _formKeys = [
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
  ];

  @override
  void initState() {
    super.initState();
    _loadCustomFields();
  }

  Future<void> _loadCustomFields() async {
    try {
      // 1. Résoudre la campagne active et l'injecter dans l'état du formulaire
      final campaignId = await ref
          .read(getActiveCampaignIdUseCaseProvider)
          .execute();
      ref.read(hexagonalCandidatureProvider.notifier).setCampaignId(campaignId);

      // 2. Charger les champs personnalisés de cette campagne
      final fields = await ref
          .read(getCampaignCustomFieldsUseCaseProvider)
          .execute(campaignId);
      if (!mounted) return;
      setState(() {
        _customFields = fields;
        _isLoadingFields = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoadingFields = false);
    }
  }

  Future<void> _submitForm() async {
    if (!_formKeys[4].currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final result = await ref
        .read(hexagonalCandidatureProvider.notifier)
        .submitWithResult();

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result.isSuccess) {
      context.go('/success?id=${result.applicationId}');
    } else {
      final trans = ref.read(translationProvider);
      showErrorDialog(
        context,
        message: trans.translate(result.errorMessage ?? AppKeys.errOccurred),
        onRetry: _submitForm,
        retryLabel: trans.translate(AppKeys.btnRetry),
        cancelLabel: trans.translate('btn_cancel'),
      );
    }
  }

  void _onStepContinue() {
    // Validation de l'étape courante
    if (!_formKeys[_currentStep].currentState!.validate()) return;

    // Validation spécifique pour les fichiers (Étape 2 / Index 2)
    final trans = ref.read(translationProvider);
    if (_currentStep == 2) {
      final state = ref.read(hexagonalCandidatureProvider);
      bool hasError = false;
      if (state.video == null) {
        setState(() => _videoError = trans.translate('err_need_video'));
        hasError = true;
      }
      if (state.photo == null) {
        setState(() => _photoError = trans.translate('err_need_photo'));
        hasError = true;
      }
      if (hasError) return;
    }

    if (_currentStep < 4) {
      setState(() => _currentStep += 1);
    } else {
      _submitForm();
    }
  }

  void _onStepCancel() {
    if (_currentStep > 0) {
      setState(() => _currentStep -= 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final formState = ref.watch(hexagonalCandidatureProvider);
    final notifier = ref.read(hexagonalCandidatureProvider.notifier);
    final isMobile = MediaQuery.of(context).size.width < 600;
    final lang = ref.watch(languageProvider);
    final trans = ref.watch(translationProvider);

    return Scaffold(
      backgroundColor: AppDesignSystem.accentYellow,
      body: Center(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 8.0 : 24.0,
            vertical: isMobile ? 12.0 : 40.0,
          ),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: AppDesignSystem.borderExtraLarge,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.12),
                  blurRadius: 40,
                  offset: const Offset(0, 20),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: AppDesignSystem.borderExtraLarge,
              child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 720),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // BRAND HEADER (Matching the Official Netlify HTML Form)
                  Padding(
                    padding: EdgeInsets.all(isMobile ? 16.0 : 28.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Left Logo (VOICE TALENTS Logo)
                        Container(
                          width: isMobile ? 55 : 80,
                          height: isMobile ? 55 : 80,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: AppDesignSystem.borderMedium,
                            border: Border.all(color: Colors.grey.shade100),
                          ),
                          child: ClipRRect(
                            borderRadius: AppDesignSystem.borderMedium,
                            child: Image.asset(
                              AppAssets.logoVoiceTalents,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(
                                Icons.mic,
                                color: AppDesignSystem.primary,
                              ),
                            ),
                          ),
                        ),
                        // Center Branded Text (Montserrat inspired, yellow with outline shadow)
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                trans.translate(AppKeys.headerFormTitle),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontFamily: 'Montserrat',
                                  fontFamilyFallback: const ['sans-serif'],
                                  fontSize: isMobile ? 14 : 26,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 4),
                              RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: TextStyle(
                                    fontFamily: 'Montserrat',
                                    fontFamilyFallback: const ['sans-serif'],
                                    fontSize: isMobile ? 12 : 20,
                                    fontWeight: FontWeight.bold,
                                    color: AppDesignSystem.primary,
                                    letterSpacing: -0.5,
                                  ),
                                  children: [
                                    const TextSpan(text: 'VOICE '),
                                    TextSpan(
                                      text: 'TALENT',
                                      style: TextStyle(
                                        color: AppDesignSystem.accentYellow,
                                        shadows: [
                                          Shadow(offset: const Offset(1, 1), color: AppDesignSystem.primary),
                                          Shadow(offset: const Offset(-1, 1), color: AppDesignSystem.primary),
                                          Shadow(offset: const Offset(1, -1), color: AppDesignSystem.primary),
                                          Shadow(offset: const Offset(-1, -1), color: AppDesignSystem.primary),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Wrap(
                                alignment: WrapAlignment.center,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  Text(
                                    trans.translate(AppKeys.headerEdition),
                                    style: TextStyle(
                                      color: Colors.grey.shade500,
                                      fontSize: isMobile ? 9 : 14,
                                      fontStyle: FontStyle.italic,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => ref.read(languageProvider.notifier).toggleLanguage(),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppDesignSystem.primary.withOpacity(0.08),
                                        borderRadius: AppDesignSystem.borderSmall,
                                        border: Border.all(color: AppDesignSystem.primary.withOpacity(0.15)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            lang == Language.fr ? 'FR 🇫🇷' : 'EN 🇬🇧',
                                            style: AppDesignSystem.labelStyle.copyWith(color: AppDesignSystem.primary, fontSize: 9),
                                          ),
                                          const SizedBox(width: 2),
                                          Icon(Icons.translate, size: 8, color: AppDesignSystem.primary),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        // Right Logo (SPONSOR PRINCIPAL JAPAP MESSENGER with active redirection link)
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              trans.translate(AppKeys.headerClickToVisit),
                              style: TextStyle(
                                color: AppDesignSystem.primary.withOpacity(0.5),
                                fontSize: isMobile ? 6 : 9,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Tooltip(
                              message: trans.translate(AppKeys.tooltipVisitJapap),
                              child: MouseRegion(
                                cursor: SystemMouseCursors.click,
                                child: GestureDetector(
                                  onTap: () async {
                                    final url = Uri.parse(AppConstants.japapMessengerUrl);
                                    if (await canLaunchUrl(url)) {
                                      await launchUrl(
                                        url,
                                        mode: LaunchMode.externalApplication,
                                      );
                                    }
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    width: isMobile ? 55 : 80,
                                    height: isMobile ? 55 : 80,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: AppDesignSystem.borderMedium,
                                      border: Border.all(color: AppDesignSystem.japapBlue.withOpacity(0.2)),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppDesignSystem.japapBlue.withOpacity(0.1),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: ClipRRect(
                                      borderRadius: AppDesignSystem.borderMedium,
                                      child: Image.asset(
                                        AppAssets.logoJapapMessenger,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => const Icon(
                                          Icons.link,
                                          color: AppDesignSystem.japapBlue,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  trans.translate(AppKeys.headerOfficialSponsor),
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: isMobile ? 6 : 9,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                                const SizedBox(width: 2),
                                Icon(Icons.touch_app, size: isMobile ? 10 : 14, color: AppDesignSystem.primary),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // CUSTOM PREMIUM STEPS PROGRESS BAR
                  Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isMobile ? 12.0 : 32.0,
                      vertical: 16.0,
                    ),
                    child: Column(
                      children: [
                        // Linear glowing progress bar
                        ClipRRect(
                          borderRadius: BorderRadius.circular(100),
                          child: LinearProgressIndicator(
                            value: (_currentStep + 1) / 5.0,
                            backgroundColor: Colors.grey.shade100,
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppDesignSystem.primary,
                            ),
                            minHeight: 6,
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Circular badges row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: List.generate(5, (index) {
                            final isActive = _currentStep == index;
                            final isCompleted = _currentStep > index;

                            // Visual Step Indicators
                            return Expanded(
                              child: Row(
                                children: [
                                  Container(
                                    width: isMobile ? 32 : 40,
                                    height: isMobile ? 32 : 40,
                                    decoration: BoxDecoration(
                                      color: isCompleted
                                          ? AppDesignSystem.success
                                          : (isActive
                                                ? AppDesignSystem.primary
                                                : Colors.grey.shade100),
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isActive
                                            ? AppDesignSystem.primaryLight
                                            : Colors.transparent,
                                        width: 2,
                                      ),
                                      boxShadow: isActive
                                          ? [
                                              BoxShadow(
                                                color: AppDesignSystem.primary
                                                    .withOpacity(0.3),
                                                blurRadius: 10,
                                                spreadRadius: 1,
                                              ),
                                            ]
                                          : [],
                                    ),
                                    child: Center(
                                      child: isCompleted
                                          ? Icon(
                                              Icons.check_rounded,
                                              color: Colors.white,
                                              size: isMobile ? 16 : 20,
                                            )
                                          : Text(
                                              '${index + 1}',
                                              style: AppDesignSystem.labelStyle
                                                  .copyWith(
                                                    color:
                                                        isActive || isCompleted
                                                        ? Colors.white
                                                        : AppDesignSystem
                                                              .textSecondary,
                                                    fontSize: isMobile
                                                        ? 12
                                                        : 14,
                                                    fontWeight: FontWeight.w800,
                                                  ),
                                            ),
                                    ),
                                  ),
                                  if (index < 4)
                                    Expanded(
                                      child: Container(
                                        height: 2,
                                        margin: const EdgeInsets.symmetric(
                                          horizontal: 4,
                                        ),
                                        color: _currentStep > index
                                            ? AppDesignSystem.success
                                                  .withOpacity(0.5)
                                            : Colors.grey.shade100,
                                      ),
                                    ),
                                ],
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 12),
                        // Current Step Name Indicator
                        Text(
                          _getStepTitle(_currentStep, trans),
                          style: AppDesignSystem.titleSmall.copyWith(
                            color: AppDesignSystem.primary,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // DYNAMIC FORM CANVAS
                  Padding(
                    padding: EdgeInsets.all(isMobile ? 16.0 : 32.0),
                    child: Container(
                      key: ValueKey<int>(_currentStep),
                      child: _buildActiveForm(
                        formState,
                        notifier,
                        trans,
                        isMobile,
                      ),
                    ),
                  ),

                  // PREMIUM CONTROL BUTTONS
                  Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isMobile ? 16.0 : 32.0,
                      vertical: 24.0,
                    ),
                    child: Row(
                      children: [
                        if (_currentStep > 0) ...[
                          Expanded(
                            child: _PremiumScaleButton(
                              onPressed: _onStepCancel,
                              isOutlined: true,
                              text: trans.translate('btn_back'),
                            ),
                          ),
                          const SizedBox(width: 16),
                        ],
                        Expanded(
                          child: _PremiumScaleButton(
                            onPressed: _isSubmitting ? null : _onStepContinue,
                            isLoading: _isSubmitting && _currentStep == 4,
                            text: _currentStep == 4
                                ? trans.translate('btn_submit')
                                : trans.translate('btn_next'),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // FOOTER (Partenaires Officiels)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)), // Matches borderExtraLarge visually if it's 32, but ClipRRect is safer. We'll rely on the ClipRRect above.
                      border: const Border(top: BorderSide(color: Color(0xFFF2F2F2))),
                    ),
                    padding: const EdgeInsets.symmetric(
                      vertical: 24,
                      horizontal: 16,
                    ),
                    child: Column(
                      children: [
                        Text(
                          trans.translate('footer_partners'),
                          style: TextStyle(
                            color: Colors.grey.shade400,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 2.0,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Sponsor Logos Animated Grid (Marquee)
                        _PartnerMarquee(
                          children: [
                            _buildPartnerLogo(
                              AppAssets.logoCentreLinguistique,
                              height: isMobile ? 70 : 100,
                            ),
                            SizedBox(width: isMobile ? 32 : 64),
                            _buildPartnerLogo(
                              AppAssets.logoOtisStudio,
                              height: isMobile ? 70 : 100,
                            ),
                            SizedBox(width: isMobile ? 32 : 64),
                            _buildPartnerLogo(
                              AppAssets.logoTalent237,
                              height: isMobile ? 70 : 100,
                            ),
                            SizedBox(width: isMobile ? 32 : 64),
                            _buildPartnerLogo(
                              AppAssets.logoJapapTalent,
                              height: isMobile ? 70 : 100,
                            ),
                            SizedBox(width: isMobile ? 32 : 64),
                            _buildPartnerLogo(
                              AppAssets.logoGlobal,
                              height: isMobile ? 70 : 100,
                            ),
                            SizedBox(width: isMobile ? 32 : 64),
                          ],
                        ),
                        const SizedBox(height: 48),
                        const Divider(color: Color(0xFFF2F2F2), thickness: 2),
                        const SizedBox(height: 32),
                        // Footer Contact & Social Section
                        _buildContactFooter(isMobile, trans, lang),
                        const SizedBox(height: 48),
                        // Action Buttons for Navigation
                        TextButton.icon(
                          onPressed: () => context.push('/tracking'),
                          icon: const Icon(Icons.track_changes, size: 18),
                          label: Text(trans.translate('tooltip_track')),
                          style: TextButton.styleFrom(
                            foregroundColor: AppDesignSystem.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      ),
    );
  }

  Widget _buildContactFooter(bool isMobile, TranslationService trans, Language lang) {
    return Column(
      children: [
        // Logo
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.asset(AppAssets.logoVoiceTalents, fit: BoxFit.cover),
          ),
        ),
        const SizedBox(height: 16),
        // Title
        Text(
          trans.translate(AppKeys.footerGenerationVoice),
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: 'Montserrat',
            fontFamilyFallback: const ['sans-serif'],
            color: AppDesignSystem.primary,
            fontSize: isMobile ? 14 : 18,
            fontWeight: FontWeight.w900,
            fontStyle: FontStyle.italic,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 32),
        const Divider(color: Color(0xFFF2F2F2), thickness: 1),
        const SizedBox(height: 32),
        // Socials
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildSocialIcon(Icons.facebook, AppConstants.facebookUrl),
            const SizedBox(width: 16),
            _buildSocialIcon(Icons.video_library, AppConstants.youtubeUrl),
            const SizedBox(width: 16),
            _buildSocialIcon(Icons.camera_alt, AppConstants.instagramUrl),
            const SizedBox(width: 16),
            _buildSocialIcon(Icons.music_note, AppConstants.tiktokUrl),
          ],
        ),
        const SizedBox(height: 32),
        Text(
          trans.translate(AppKeys.footerContactUs),
          style: TextStyle(
            color: Colors.grey.shade400,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2.0,
          ),
        ),
        const SizedBox(height: 24),
        // Contact details
        Center(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildContactRow(Icons.email_outlined, AppConstants.contactEmail),
              const SizedBox(height: 16),
              _buildContactRow(Icons.phone_outlined, AppConstants.contactPhone),
              const SizedBox(height: 16),
              _buildContactRow(Icons.location_on_outlined, trans.translate(AppKeys.footerAddress), isMobile: isMobile),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSocialIcon(IconData icon, String url) {
    return InkWell(
      onTap: () async {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: const BoxDecoration(
          color: AppDesignSystem.primary,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String text, {bool isMobile = false}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppDesignSystem.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppDesignSystem.primary, size: 16),
        ),
        const SizedBox(width: 16),
        Flexible(
          child: Text(
            text,
            style: AppDesignSystem.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: AppDesignSystem.primary),
          ),
        ),
      ],
    );
  }

  Widget _buildPartnerLogo(String assetPath, {double height = 100}) {
    return SizedBox(
      height: height,
      width: 240, // Increased width to accommodate larger logos without squishing
      child: Image.asset(
        assetPath,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) =>
            const Icon(Icons.business, color: Colors.grey, size: 36),
      ),
    );
  }

  String _getStepTitle(int step, TranslationService trans) {
    switch (step) {
      case 0:
        return trans.translate('step_identity');
      case 1:
        return trans.translate('step_networks');
      case 2:
        return trans.translate('step_files');
      case 3:
        return trans.translate('step_specificities');
      case 4:
        return trans.translate('step_consent');
      default:
        return '';
    }
  }

  Widget _buildActiveForm(
    Candidature formState,
    HexagonalCandidatureNotifier notifier,
    TranslationService trans,
    bool isMobile,
  ) {
    switch (_currentStep) {
      case 0:
        return Form(
          key: _formKeys[0],
          child: Column(
            children: [
              // ── Nom + WhatsApp ──────────────────────────────
              LayoutBuilder(
                builder: (context, constraints) {
                  final useRow = constraints.maxWidth >= 560;
                  Widget nom = CustomTextField(
                    label: trans.translate('label_fullname'),
                    hint: trans.translate('hint_fullname'),
                    initialValue: formState.nomPrenom,
                    validator: Validators.fullName,
                    keyboardType: TextInputType.name,
                    textInputAction: TextInputAction.next,
                    onChanged: (val) => notifier.updateField(nomPrenom: val),
                  );
                  Widget wa = CustomTextField(
                    label: trans.translate('label_whatsapp'),
                    hint: trans.translate('hint_whatsapp'),
                    initialValue: formState.whatsapp,
                    validator: Validators.phone,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(
                        RegExp(r'[\d\s\+\-\(\)\.]'),
                      ),
                    ],
                    onChanged: (val) => notifier.updateField(whatsapp: val),
                  );
                  return useRow
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Flexible(child: nom),
                            const SizedBox(width: 16),
                            Flexible(child: wa),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [nom, const SizedBox(height: 16), wa],
                        );
                },
              ),
              const SizedBox(height: 16),
              // ── Âge + Sexe + Statut ─────────────────────────
              LayoutBuilder(
                builder: (context, constraints) {
                  final useRow = constraints.maxWidth >= 560;
                  Widget age = SizedBox(
                    width: useRow ? 120 : double.infinity,
                    child: CustomTextField(
                      label: trans.translate('label_age'),
                      hint: trans.translate('hint_age'),
                      initialValue: formState.age == null
                          ? ''
                          : formState.age.toString(),
                      validator: Validators.age,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.next,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(2),
                      ],
                      onChanged: (val) =>
                          notifier.updateField(age: int.tryParse(val.trim())),
                    ),
                  );
                  Widget sexe = CustomDropdown(
                    label: trans.translate('label_sexe'),
                    hint: trans.translate('hint_select'),
                    items: [
                      trans.translate('sex_male'),
                      trans.translate('sex_female'),
                    ],
                    value: formState.sexe.isEmpty
                        ? null
                        : (formState.sexe == 'Femme'
                              ? trans.translate('sex_female')
                              : trans.translate('sex_male')),
                    validator: Validators.dropdown,
                    onChanged: (val) => notifier.updateField(
                      sexe: val == trans.translate('sex_female')
                          ? 'Femme'
                          : 'Homme',
                    ),
                  );
                  Widget statut = CustomDropdown(
                    label: trans.translate('label_status'),
                    hint: trans.translate('hint_select'),
                    items: [
                      trans.translate('status_single'),
                      trans.translate('status_married'),
                      trans.translate('status_other'),
                    ],
                    value: formState.statut.isEmpty
                        ? null
                        : (formState.statut == 'Célibataire'
                              ? trans.translate('status_single')
                              : formState.statut == 'Marié(e)'
                              ? trans.translate('status_married')
                              : trans.translate('status_other')),
                    validator: Validators.dropdown,
                    onChanged: (val) => notifier.updateField(
                      statut: val == trans.translate('status_single')
                          ? 'Célibataire'
                          : val == trans.translate('status_married')
                          ? 'Marié(e)'
                          : 'Autre',
                    ),
                  );
                  return useRow
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            age,
                            const SizedBox(width: 16),
                            Flexible(child: sexe),
                            const SizedBox(width: 16),
                            Flexible(child: statut),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            age,
                            const SizedBox(height: 16),
                            sexe,
                            const SizedBox(height: 16),
                            statut,
                          ],
                        );
                },
              ),
            ],
          ),
        );
      case 1:
        return Form(
          key: _formKeys[1],
          child: Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              SizedBox(
                width: isMobile ? double.infinity : 310,
                child: CustomDropdown(
                  label: trans.translate('label_active_network'),
                  hint: trans.translate('hint_select'),
                  items: const [
                    'JAPAP MESSENGER',
                    'FACEBOOK',
                    'TIKTOK',
                    'YOUTUBE',
                    'INSTAGRAM',
                    'LINKEDIN',
                  ],
                  value: formState.reseauActif.isEmpty
                      ? null
                      : formState.reseauActif,
                  validator: Validators.required,
                  onChanged: (val) => notifier.updateField(reseauActif: val),
                ),
              ),
              SizedBox(
                width: isMobile ? double.infinity : 310,
                child: CustomDropdown(
                  label: trans.translate('label_followers'),
                  hint: trans.translate('hint_select'),
                  items: const [
                    '0 à 5 000',
                    '5 000 à 20 000',
                    '20 000 à 100 000',
                    'Plus de 100 000',
                  ],
                  value: formState.nombreAbonnes.isEmpty
                      ? null
                      : formState.nombreAbonnes,
                  validator: Validators.required,
                  onChanged: (val) => notifier.updateField(nombreAbonnes: val),
                ),
              ),
              SizedBox(
                width: double.infinity,
                child: CustomTextField(
                  label: trans.translate('label_social_link'),
                  hint: trans.translate('hint_social_link'),
                  initialValue: formState.lienReseau ?? '',
                  keyboardType: TextInputType.url,
                  textInputAction: TextInputAction.done,
                  validator: Validators.optionalUrl,
                  prefixIcon: const Icon(Icons.link_rounded, size: 18),
                  onChanged: (val) => notifier.updateField(
                    lienReseau: val.trim().isEmpty ? null : val.trim(),
                  ),
                ),
              ),
            ],
          ),
        );
      case 2:
        return Form(
          key: _formKeys[2],
          child: Column(
            children: [
              FileUploadWidget(
                label: trans.translate('label_video'),
                currentFile: formState.video?.name,
                file: formState.video,
                errorText: _videoError,
                onPick: () async {
                  final error = await notifier.pickVideo();
                  setState(
                    () => _videoError = error != null
                        ? trans.translate(error)
                        : null,
                  );
                },
                onClear: formState.video != null
                    ? () {
                        notifier.clearVideo();
                        setState(() => _videoError = null);
                      }
                    : null,
              ),
              const SizedBox(height: 20),
              FileUploadWidget(
                label: trans.translate('label_photo'),
                currentFile: formState.photo?.name,
                file: formState.photo,
                errorText: _photoError,
                onPick: () async {
                  final error = await notifier.pickPhoto();
                  setState(
                    () => _photoError = error != null
                        ? trans.translate(error)
                        : null,
                  );
                },
                onClear: formState.photo != null
                    ? () {
                        notifier.clearPhoto();
                        setState(() => _photoError = null);
                      }
                    : null,
              ),
            ],
          ),
        );
      case 3:
        return Form(
          key: _formKeys[3],
          child: _isLoadingFields
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: _customFields.map((field) {
                    final translatedLabel = trans.translate(field.label);
                    final translatedOptions = field.options
                        .map((opt) => trans.translate(opt))
                        .toList();
                    final existingResponse = formState.customResponses
                        .firstWhere(
                          (r) => r.fieldId == field.id,
                          orElse: () => const CustomResponse(
                            applicationId: '',
                            fieldId: '',
                            value: '',
                          ),
                        )
                        .value;

                    if (field.type == 'dropdown') {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: CustomDropdown(
                          label: translatedLabel,
                          hint: trans.translate('hint_select'),
                          items: translatedOptions,
                          value: existingResponse.isEmpty
                              ? null
                              : trans.translate(existingResponse),
                          validator: field.isRequired
                              ? Validators.required
                              : null,
                          onChanged: (val) {
                            final originalIdx = translatedOptions.indexOf(
                              val ?? '',
                            );
                            final originalVal = originalIdx != -1
                                ? field.options[originalIdx]
                                : (val ?? '');
                            notifier.updateCustomResponse(
                              field.id,
                              originalVal,
                            );
                          },
                        ),
                      );
                    } else if (field.type == 'number') {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: CustomTextField(
                          key: ValueKey('number_${field.id}'),
                          label: translatedLabel,
                          hint: '0',
                          initialValue: existingResponse.isEmpty
                              ? null
                              : existingResponse,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          validator: (v) => Validators.number(
                            v,
                            isRequired: field.isRequired,
                            min: 0,
                            max: 99,
                          ),
                          onChanged: (val) => ref
                              .read(hexagonalCandidatureProvider.notifier)
                              .updateCustomResponse(field.id, val),
                        ),
                      );
                    } else if (field.type == 'text') {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: CustomTextField(
                          key: ValueKey('text_${field.id}'),
                          label: translatedLabel,
                          hint: trans.translate('hint_comment'),
                          initialValue: existingResponse.isEmpty
                              ? null
                              : existingResponse,
                          maxLines: 5,
                          maxLength: 500,
                          keyboardType: TextInputType.multiline,
                          textInputAction: TextInputAction.newline,
                          validator: field.isRequired
                              ? (v) => Validators.comment(v, minChars: 50)
                              : (v) => Validators.longText(v),
                          onChanged: (val) => ref
                              .read(hexagonalCandidatureProvider.notifier)
                              .updateCustomResponse(field.id, val),
                        ),
                      );
                    } else {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: CustomTextField(
                          label: translatedLabel,
                          hint: trans.translate('hint_select'),
                          initialValue: existingResponse,
                          validator: field.isRequired
                              ? Validators.required
                              : null,
                          onChanged: (val) =>
                              notifier.updateCustomResponse(field.id, val),
                        ),
                      );
                    }
                  }).toList(),
                ),
        );
      case 4:
        return _Step5ConsentForm(formKey: _formKeys[4], trans: trans);
      default:
        return const SizedBox();
    }
  }
}

class _Step5ConsentForm extends ConsumerStatefulWidget {
  final GlobalKey<FormState> formKey;
  final TranslationService trans;
  const _Step5ConsentForm({required this.formKey, required this.trans});

  @override
  ConsumerState<_Step5ConsentForm> createState() => _Step5ConsentFormState();
}

class _Step5ConsentFormState extends ConsumerState<_Step5ConsentForm> {
  late final TextEditingController _telController;
  late final TextEditingController _quartierController;
  bool _consentValue = false;

  @override
  void initState() {
    super.initState();
    final state = ref.read(hexagonalCandidatureProvider);
    _telController = TextEditingController(text: state.telephoneProche);
    _quartierController = TextEditingController(text: state.quartier);
    _consentValue = state.consentAccepted ?? false;
  }

  @override
  void dispose() {
    _telController.dispose();
    _quartierController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final trans = widget.trans;

    return Form(
      key: widget.formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final useRow = constraints.maxWidth >= 560;
              Widget tel = CustomTextField(
                controller: _telController,
                label: trans.translate('label_contact_phone'),
                hint: '+237 ...',
                validator: Validators.phone,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(
                    RegExp(r'[\d\s\+\-\(\)\.]'),
                  ),
                ],
                onChanged: (val) => ref
                    .read(hexagonalCandidatureProvider.notifier)
                    .updateField(telephoneProche: val),
              );
              Widget quartier = CityQuartierField(
                label: trans.translate('label_neighborhood'),
                hint: trans.translate('hint_neighborhood'),
                initialValue: _quartierController.text,
                validator: Validators.neighborhood,
                onChanged: (val) => ref
                    .read(hexagonalCandidatureProvider.notifier)
                    .updateField(quartier: val),
              );
              return useRow
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Flexible(child: tel),
                        const SizedBox(width: 16),
                        Flexible(child: quartier),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [tel, const SizedBox(height: 16), quartier],
                    );
            },
          ),
          const SizedBox(height: 24),
          FormField<bool>(
            initialValue: _consentValue,
            validator: (value) =>
                value != true ? trans.translate('err_consent_required') : null,
            builder: (field) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CheckboxListTile(
                  title: Text(
                    trans.translate('label_consent_checkbox'),
                    style: AppDesignSystem.bodyMedium.copyWith(
                      color: AppDesignSystem.textMain,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  value: field.value,
                  onChanged: (val) {
                    field.didChange(val);
                    setState(() => _consentValue = val ?? false);
                    ref
                        .read(hexagonalCandidatureProvider.notifier)
                        .updateField(consentAccepted: val);
                  },
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  activeColor: AppDesignSystem.primary,
                ),
                if (field.hasError)
                  Padding(
                    padding: const EdgeInsets.only(left: 12.0, top: 4.0),
                    child: Text(
                      field.errorText!,
                      style: const TextStyle(color: Colors.red, fontSize: 12),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PremiumScaleButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String text;
  final bool isOutlined;
  final bool isLoading;

  const _PremiumScaleButton({
    required this.onPressed,
    required this.text,
    this.isOutlined = false,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(
              color: Colors.white,
              strokeWidth: 2.5,
            ),
          )
        : Text(
            text,
            style: AppDesignSystem.buttonText.copyWith(
              color: isOutlined ? AppDesignSystem.primary : Colors.white,
              fontWeight: FontWeight.w800,
            ),
          );

    final shape = RoundedRectangleBorder(
      borderRadius: AppDesignSystem.borderMedium,
    );
    const padding = EdgeInsets.symmetric(vertical: 18);

    if (isOutlined) {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
            padding: padding,
            side: const BorderSide(color: AppDesignSystem.primary, width: 1.5),
            shape: shape,
          ),
          child: child,
        ),
      );
    }
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          padding: padding,
          backgroundColor: AppDesignSystem.primary,
          shape: shape,
          elevation: 4,
        ),
        child: child,
      ),
    );
  }
}

class _PartnerMarquee extends StatefulWidget {
  final List<Widget> children;
  const _PartnerMarquee({required this.children});

  @override
  State<_PartnerMarquee> createState() => _PartnerMarqueeState();
}

class _PartnerMarqueeState extends State<_PartnerMarquee> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const NeverScrollableScrollPhysics(),
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return FractionalTranslation(
            translation: Offset(-(_controller.value / 4), 0),
            child: child,
          );
        },
        child: Row(
          children: [
            ...widget.children,
            ...widget.children,
            ...widget.children,
            ...widget.children,
          ],
        ),
      ),
    );
  }
}
