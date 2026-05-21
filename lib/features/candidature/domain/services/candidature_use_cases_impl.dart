import '../entities/candidature.dart';
import '../entities/custom_field.dart';
import '../ports/in/save_candidature_use_case.dart';
import '../ports/in/get_candidatures_use_case.dart';
import '../ports/in/update_status_use_case.dart';
import '../ports/in/get_active_campaign_use_case.dart';
import '../ports/in/get_campaign_custom_fields_use_case.dart';
import '../ports/in/track_candidature_status_use_case.dart';
import '../ports/out/candidature_repository_port.dart';

class SaveCandidatureUseCaseImpl implements SaveCandidatureUseCase {
  final CandidatureRepositoryPort _repositoryPort;

  SaveCandidatureUseCaseImpl(this._repositoryPort);

  @override
  Future<String> execute(Candidature candidature) async {
    if (candidature.nomPrenom.trim().isEmpty) {
      throw ArgumentError("Le nom complet est obligatoire.");
    }
    if (candidature.consentAccepted == false) {
      throw ArgumentError("Le consentement explicite RGPD est obligatoire.");
    }
    return _repositoryPort.save(candidature);
  }
}

class GetCandidaturesUseCaseImpl implements GetCandidaturesUseCase {
  final CandidatureRepositoryPort _repositoryPort;

  GetCandidaturesUseCaseImpl(this._repositoryPort);

  @override
  Future<List<Candidature>> execute() async {
    return await _repositoryPort.getAll();
  }
}

class UpdateStatusUseCaseImpl implements UpdateStatusUseCase {
  final CandidatureRepositoryPort _repositoryPort;

  UpdateStatusUseCaseImpl(this._repositoryPort);

  @override
  Future<void> execute(String id, String status, {String? comment}) async {
    if (id.trim().isEmpty) {
      throw ArgumentError("L'identifiant du dossier est invalide.");
    }
    await _repositoryPort.updateStatus(id, status, comment: comment);
  }
}

class GetActiveCampaignIdUseCaseImpl implements GetActiveCampaignIdUseCase {
  final CandidatureRepositoryPort _repositoryPort;

  GetActiveCampaignIdUseCaseImpl(this._repositoryPort);

  @override
  Future<String> execute() => _repositoryPort.getActiveCampaignId();
}

class GetCampaignCustomFieldsUseCaseImpl implements GetCampaignCustomFieldsUseCase {
  final CandidatureRepositoryPort _repositoryPort;

  GetCampaignCustomFieldsUseCaseImpl(this._repositoryPort);

  @override
  Future<List<CustomField>> execute(String campaignId) async {
    return await _repositoryPort.getCustomFields(campaignId);
  }
}

class TrackCandidatureStatusUseCaseImpl implements TrackCandidatureStatusUseCase {
  final CandidatureRepositoryPort _repositoryPort;

  TrackCandidatureStatusUseCaseImpl(this._repositoryPort);

  @override
  Future<Map<String, dynamic>> execute(String applicationId) async {
    if (applicationId.trim().isEmpty) {
      throw ArgumentError("L'ID de candidature est requis pour le suivi.");
    }

    final history = await _repositoryPort.getStatusHistory(applicationId);
    final logs = await _repositoryPort.getWhatsAppLogs(applicationId);

    return {
      'application_id': applicationId,
      'status_history': history,
      'whatsapp_notifications': logs,
    };
  }
}
