import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../../domain/entities/candidature.dart';
import '../../domain/entities/domain_file.dart';
import '../../domain/entities/custom_response.dart';
import '../../domain/ports/in/save_candidature_use_case.dart';
import '../../domain/ports/in/get_candidatures_use_case.dart';
import '../../domain/ports/in/update_status_use_case.dart';
import '../../domain/ports/in/get_active_campaign_use_case.dart';
import '../../domain/ports/in/get_campaign_custom_fields_use_case.dart';
import '../../domain/ports/in/track_candidature_status_use_case.dart';
import '../out/supabase_candidature_repository_adapter.dart';
import '../../domain/services/candidature_use_cases_impl.dart';

// ─── Outbound Port Provider ───────────────────────────────────────────────────
final candidatureRepositoryPortProvider =
    Provider<SupabaseCandidatureRepositoryAdapter>((ref) {
  return SupabaseCandidatureRepositoryAdapter();
});

// ─── Use Case Providers ───────────────────────────────────────────────────────
final saveCandidatureUseCaseProvider = Provider<SaveCandidatureUseCase>((ref) {
  return SaveCandidatureUseCaseImpl(ref.watch(candidatureRepositoryPortProvider));
});

final getCandidaturesUseCaseProvider = Provider<GetCandidaturesUseCase>((ref) {
  return GetCandidaturesUseCaseImpl(ref.watch(candidatureRepositoryPortProvider));
});

final updateStatusUseCaseProvider = Provider<UpdateStatusUseCase>((ref) {
  return UpdateStatusUseCaseImpl(ref.watch(candidatureRepositoryPortProvider));
});

final getActiveCampaignIdUseCaseProvider =
    Provider<GetActiveCampaignIdUseCase>((ref) {
  return GetActiveCampaignIdUseCaseImpl(
      ref.watch(candidatureRepositoryPortProvider));
});

final getCampaignCustomFieldsUseCaseProvider =
    Provider<GetCampaignCustomFieldsUseCase>((ref) {
  return GetCampaignCustomFieldsUseCaseImpl(
      ref.watch(candidatureRepositoryPortProvider));
});

final trackCandidatureStatusUseCaseProvider =
    Provider<TrackCandidatureStatusUseCase>((ref) {
  return TrackCandidatureStatusUseCaseImpl(
      ref.watch(candidatureRepositoryPortProvider));
});

// ─── Main Form State Controller ───────────────────────────────────────────────
final hexagonalCandidatureProvider =
    NotifierProvider<HexagonalCandidatureNotifier, Candidature>(() {
  return HexagonalCandidatureNotifier();
});

class HexagonalCandidatureNotifier extends Notifier<Candidature> {
  @override
  Candidature build() => const Candidature();

  // ── Field Updates ─────────────────────────────────────────────────────────

  void updateField({
    String? nomPrenom,
    String? whatsapp,
    int? age,
    String? sexe,
    String? statut,
    String? reseauActif,
    String? nombreAbonnes,
    String? telephoneProche,
    String? quartier,
    bool? consentAccepted,
  }) {
    state = state.copyWith(
      nomPrenom: nomPrenom,
      whatsapp: whatsapp,
      age: age,
      sexe: sexe,
      statut: statut,
      reseauActif: reseauActif,
      nombreAbonnes: nombreAbonnes,
      telephoneProche: telephoneProche,
      quartier: quartier,
      consentAccepted: consentAccepted,
    );
  }

  void setCampaignId(String campaignId) {
    state = state.copyWith(campaignId: campaignId);
  }

  void updateCustomResponse(String fieldId, String value) {
    final updated = List<CustomResponse>.from(state.customResponses);
    final idx = updated.indexWhere((r) => r.fieldId == fieldId);
    final entry = CustomResponse(
      applicationId: state.id ?? '',
      fieldId: fieldId,
      value: value.trim(),
    );
    if (idx != -1) {
      updated[idx] = entry;
    } else {
      updated.add(entry);
    }
    state = state.copyWith(customResponses: updated);
  }

  // ── File Pickers ──────────────────────────────────────────────────────────

  static const _allowedVideoExts = {'mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'};
  static const _allowedImageExts = {'jpg', 'jpeg', 'png', 'webp', 'heic'};

  /// Picks a video file. Returns a localized error message on failure, null on success.
  Future<String?> pickVideo() async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.video,
        withData: true,
        allowMultiple: false,
      );
      if (result == null) return null; // user cancelled — not an error
      final file = result.files.single;
      final error = _validateFile(file, maxMb: 10, allowedExts: _allowedVideoExts);
      if (error != null) return error;
      state = state.copyWith(
        video: DomainFile(
          name: file.name,
          size: file.size,
          bytes: file.bytes,
          path: file.path,
        ),
      );
      return null;
    } catch (_) {
      return 'err_video_pick';
    }
  }

  /// Picks a photo file. Returns a localized error message on failure, null on success.
  Future<String?> pickPhoto() async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.image,
        withData: true,
        allowMultiple: false,
      );
      if (result == null) return null; // user cancelled — not an error
      final file = result.files.single;
      final error = _validateFile(file, maxMb: 5, allowedExts: _allowedImageExts, sizeErrorKey: 'err_file_too_large_photo');
      if (error != null) return error;
      state = state.copyWith(
        photo: DomainFile(
          name: file.name,
          size: file.size,
          bytes: file.bytes,
          path: file.path,
        ),
      );
      return null;
    } catch (_) {
      return 'err_photo_pick';
    }
  }

  /// Uses the sentinel pattern from the Candidature entity to set video to null.
  void clearVideo() => state = state.copyWith(video: null);

  /// Uses the sentinel pattern from the Candidature entity to set photo to null.
  void clearPhoto() => state = state.copyWith(photo: null);

  // ── Form Reset ────────────────────────────────────────────────────────────

  void reset() => state = const Candidature();

  // ── Submit ────────────────────────────────────────────────────────────────

  /// Submits the candidature. Returns a [SubmitResult] with success flag + error.
  Future<SubmitResult> submitWithResult() async {
    try {
      final saveUseCase = ref.read(saveCandidatureUseCaseProvider);
      final appId = await saveUseCase.execute(state);
      state = const Candidature();
      return SubmitResult.success(appId);
    } on Exception catch (e) {
      final msg = _humanReadableError(e);
      return SubmitResult.failure(msg);
    } catch (e) {
      return SubmitResult.failure('err_unexpected');
    }
  }

  /// Legacy bool-returning submit for backward compatibility.
  Future<bool> submit() async {
    final result = await submitWithResult();
    return result.isSuccess;
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  String? _validateFile(PlatformFile file, {required int maxMb, required Set<String> allowedExts, String sizeErrorKey = 'err_file_too_large'}) {
    if (file.bytes == null && file.path == null) return 'err_file_invalid';
    final ext = file.name.split('.').last.toLowerCase();
    if (!allowedExts.contains(ext)) return 'err_file_bad_ext';
    final maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) return sizeErrorKey;
    return null;
  }

  String _humanReadableError(Exception e) {
    final msg = e.toString().toLowerCase();

    if (msg.contains('non authentifié') || msg.contains('authenticated') ||
        msg.contains('jwt') || msg.contains('anon') || msg.contains('unauthorized') ||
        msg.contains('401')) { return 'err_not_authenticated'; }
    if (msg.contains('aucune campagne')) { return 'err_no_campaign'; }
    if (msg.contains('network') || msg.contains('socket') || msg.contains('connection')) { return 'err_connection'; }
    if (msg.contains('storage') || msg.contains('upload')) { return 'err_upload_files'; }
    if (msg.contains('duplicate') || msg.contains('unique')) { return 'err_duplicate_whatsapp'; }
    if (msg.contains('row-level security') || msg.contains('rls') || msg.contains('policy')) { return 'err_access_denied'; }

    return 'err_generic_submit';
  }
}

// ─── Result Type ──────────────────────────────────────────────────────────────

/// A simple discriminated union for submit results.
class SubmitResult {
  final bool isSuccess;
  final String? errorMessage;
  final String? applicationId;

  const SubmitResult.success(this.applicationId)
      : isSuccess = true,
        errorMessage = null;

  const SubmitResult.failure(this.errorMessage)
      : isSuccess = false,
        applicationId = null;
}
