import '../../entities/custom_field.dart';

abstract class GetCampaignCustomFieldsUseCase {
  Future<List<CustomField>> execute(String campaignId);
}
