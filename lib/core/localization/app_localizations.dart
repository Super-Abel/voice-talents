import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'translation_provider.dart';

export 'translation_provider.dart' show Language, languageProvider, translationProvider, TranslationService;

/// Convenience extension — usage: context.t('key') or context.tr.translate('key')
extension AppLocalizationsX on BuildContext {
  TranslationService get tr => _inheritedTr(this);
  String t(String key) => _inheritedTr(this).translate(key);
}

TranslationService _inheritedTr(BuildContext context) {
  // Reads the nearest ProviderScope — works inside ConsumerWidget/ConsumerStatefulWidget.
  // Falls back to French if no scope is found (e.g. in tests).
  try {
    return ProviderScope.containerOf(context).read(translationProvider);
  } catch (_) {
    return TranslationService(Language.fr);
  }
}

/// All translation keys in one place.
/// Use these constants everywhere instead of raw strings to get compile-time safety.
abstract class AppKeys {
  // ── Header ────────────────────────────────────────────────────────────────
  static const headerTitle       = 'header_title';
  static const headerSeason      = 'header_season';

  // ── Tooltips ──────────────────────────────────────────────────────────────
  static const tooltipAdmin      = 'tooltip_admin';
  static const tooltipTrack      = 'tooltip_track';
  static const tooltipRefresh    = 'tooltip_refresh';
  static const tooltipLogout     = 'tooltip_logout';
  static const tooltipEvaluate   = 'tooltip_evaluate';
  static const tooltipPhoto      = 'tooltip_photo';
  static const tooltipVideo      = 'tooltip_video';

  // ── Steps ─────────────────────────────────────────────────────────────────
  static const stepIdentity      = 'step_identity';
  static const stepNetworks      = 'step_networks';
  static const stepFiles         = 'step_files';
  static const stepSpecificities = 'step_specificities';
  static const stepConsent       = 'step_consent';

  // ── Labels ────────────────────────────────────────────────────────────────
  static const labelFullname           = 'label_fullname';
  static const labelWhatsapp           = 'label_whatsapp';
  static const labelAge                = 'label_age';
  static const labelSexe               = 'label_sexe';
  static const labelStatus             = 'label_status';
  static const labelActiveNetwork      = 'label_active_network';
  static const labelFollowers          = 'label_followers';
  static const labelVideo              = 'label_video';
  static const labelPhoto              = 'label_photo';
  static const labelContactPhone       = 'label_contact_phone';
  static const labelNeighborhood       = 'label_neighborhood';
  static const labelConsentCheckbox    = 'label_consent_checkbox';
  static const labelVoiceRange         = 'label_voice_range';
  static const labelSingingExperience  = 'label_singing_experience';
  static const labelWhyVoice           = 'label_why_voice';
  static const labelCandidatures       = 'label_candidatures';
  static const labelCurrentStatus      = 'label_current_status';
  static const labelEvaluationHistory  = 'label_evaluation_history';
  static const labelWhatsappNotif      = 'label_whatsapp_notifications';
  static const labelEmail              = 'label_email';
  static const labelPassword           = 'label_password';

  // ── Hints ─────────────────────────────────────────────────────────────────
  static const hintFullname      = 'hint_fullname';
  static const hintWhatsapp      = 'hint_whatsapp';
  static const hintAge           = 'hint_age';
  static const hintSelect        = 'hint_select';
  static const hintNeighborhood  = 'hint_neighborhood';
  static const hintCandidateId   = 'hint_candidate_id';
  static const hintComment       = 'hint_comment';
  static const hintSearchCandidate = 'hint_search_candidate';

  // ── Options ───────────────────────────────────────────────────────────────
  static const sexMale           = 'sex_male';
  static const sexFemale         = 'sex_female';
  static const statusSingle      = 'status_single';
  static const statusMarried     = 'status_married';
  static const statusOther       = 'status_other';
  static const optSoprano        = 'opt_soprano';
  static const optAlto           = 'opt_alto';
  static const optTenor          = 'opt_tenor';
  static const optBass           = 'opt_bass';
  static const optUnknownRange   = 'opt_unknown_range';

  // ── Buttons ───────────────────────────────────────────────────────────────
  static const btnNext           = 'btn_next';
  static const btnBack           = 'btn_back';
  static const btnSubmit         = 'btn_submit';
  static const btnSubmitting     = 'btn_submitting';
  static const btnHome           = 'btn_home';
  static const btnTrack          = 'btn_track';
  static const btnSearch         = 'btn_search';
  static const btnLogin          = 'btn_login';
  static const btnReturnForm     = 'btn_return_form';
  static const btnPdfReport      = 'btn_pdf_report';
  static const btnExportCsv      = 'btn_export_csv';
  static const btnReset          = 'btn_reset';
  static const btnCancel         = 'btn_cancel';
  static const btnSave           = 'btn_save';
  static const btnRetry          = 'btn_retry';

  // ── Upload widget ─────────────────────────────────────────────────────────
  static const uploadVideoPrompt    = 'upload_video_prompt';
  static const uploadAudioPrompt    = 'upload_audio_prompt';
  static const uploadPhotoPrompt    = 'upload_photo_prompt';
  static const uploadClickHint      = 'upload_click_hint';
  static const uploadMaxSizeVideo   = 'upload_max_size_video';
  static const uploadMaxSizePhoto   = 'upload_max_size_photo';
  static const uploadVideoLoaded    = 'upload_video_loaded';
  static const uploadAudioLoaded    = 'upload_audio_loaded';
  static const uploadPhotoLoaded    = 'upload_photo_loaded';
  static const uploadPreviewWebOnly = 'upload_preview_web_only';
  static const uploadTooltipPlay    = 'upload_tooltip_play';
  static const uploadTooltipView    = 'upload_tooltip_view';
  static const uploadTooltipDelete  = 'upload_tooltip_delete';
  static const uploadActionEnlarge  = 'upload_action_enlarge';
  static const uploadActionFullscreen = 'upload_action_fullscreen';

  // ── Errors ────────────────────────────────────────────────────────────────
  static const errNeedVideo         = 'err_need_video';
  static const errNeedPhoto         = 'err_need_photo';
  static const errConsentRequired   = 'err_consent_required';
  static const errSubmitFailed      = 'err_submit_failed';
  static const errEnterId           = 'err_enter_id';
  static const errIdNotFound        = 'err_id_not_found';
  static const errFillAllFields     = 'err_fill_all_fields';
  static const errIncorrectCreds    = 'err_incorrect_credentials';
  static const errNoMatchingItems   = 'err_no_matching_candidatures';
  static const errUnexpected        = 'err_unexpected';
  static const errGenericSubmit     = 'err_generic_submit';
  static const errNoCampaign        = 'err_no_campaign';
  static const errUploadFiles       = 'err_upload_files';
  static const errNotAuthenticated  = 'err_not_authenticated';
  static const errConnection        = 'err_connection';
  static const errDuplicateWhatsapp = 'err_duplicate_whatsapp';
  static const errAccessDenied      = 'err_access_denied';
  static const errVideoPick         = 'err_video_pick';
  static const errPhotoPick         = 'err_photo_pick';
  static const errFileTooLarge      = 'err_file_too_large';
  static const errFileTooLargePhoto = 'err_file_too_large_photo';
  static const errFileInvalid       = 'err_file_invalid';
  static const errFileBadExt        = 'err_file_bad_ext';
  static const errOccurred          = 'err_occurred';

  // ── Success ───────────────────────────────────────────────────────────────
  static const successCongrats      = 'success_congrats';
  static const successMessage       = 'success_message';

  // ── Status labels ─────────────────────────────────────────────────────────
  static const statusSubmitted      = 'status_submitted';
  static const statusUnderReview    = 'status_under_review';
  static const statusShortlisted    = 'status_shortlisted';
  static const statusRejected       = 'status_rejected';
  static const statusAccepted       = 'status_accepted';
  static const statusAll            = 'status_all';

  // ── Admin / filters ───────────────────────────────────────────────────────
  static const genderAll            = 'gender_all';
  static const genderMales          = 'gender_males';
  static const genderFemales        = 'gender_females';
  static const colName              = 'col_name';
  static const colAge               = 'col_age';
  static const colGender            = 'col_gender';
  static const colNetwork           = 'col_network';
  static const colWhatsapp          = 'col_whatsapp';
  static const colStatus            = 'col_status';
  static const colActions           = 'col_actions';
  static const adminAccess          = 'admin_access';
  static const adminTitle           = 'admin_title';
  static const sidebarTitle         = 'sidebar_title';
  static const sidebarCandidatures  = 'sidebar_candidatures';
  static const sidebarSettings      = 'sidebar_settings';

  // ── Dialog ────────────────────────────────────────────────────────────────
  static const dialogEvaluationTitle = 'dialog_evaluation_title';
  static const dialogChangeStatus    = 'dialog_change_status';
  static const dialogAddNote         = 'dialog_add_note';
  static const dialogNoteHint        = 'dialog_note_hint';

  // ── Toasts ────────────────────────────────────────────────────────────────
  static const toastEvalSaved       = 'toast_eval_saved';
  static const toastUpdateError     = 'toast_update_error';
  static const toastSettingsOp      = 'toast_settings_op';

  // ── Tracking ──────────────────────────────────────────────────────────────
  static const trackTitle           = 'track_title';
  static const trackSubtitle        = 'track_subtitle';
  static const noHistory            = 'no_history';
  static const noWhatsappLogs       = 'no_whatsapp_logs';

  // ── Misc ──────────────────────────────────────────────────────────────────
  static const footerPartners       = 'footer_partners';
  static const pdfTitle             = 'pdf_title';
}
