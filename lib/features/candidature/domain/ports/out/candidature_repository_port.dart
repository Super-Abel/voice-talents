import '../../entities/candidature.dart';
import '../../entities/custom_field.dart';

abstract class CandidatureRepositoryPort {
  Future<String> save(Candidature candidature);
  Future<List<Candidature>> getAll();
  Future<void> updateStatus(String id, String status, {String? comment});
  Future<void> addScore(String id, int score, {String? notes});
  Future<String> getActiveCampaignId();
  Future<List<CustomField>> getCustomFields(String campaignId);
  Future<List<Map<String, dynamic>>> getStatusHistory(String applicationId);
  Future<List<Map<String, dynamic>>> getWhatsAppLogs(String applicationId);
}
