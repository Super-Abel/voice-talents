class CustomField {
  final String id;
  final String campaignId;
  final String label;
  final String type; // 'text', 'number', 'boolean', 'dropdown'
  final bool isRequired;
  final List<String> options;
  final int displayOrder;

  const CustomField({
    required this.id,
    required this.campaignId,
    required this.label,
    required this.type,
    this.isRequired = false,
    this.options = const [],
    this.displayOrder = 0,
  });

  factory CustomField.fromMap(Map<String, dynamic> map) {
    final rawOptions = map['dropdown_options'];
    List<String> parsedOptions = [];
    if (rawOptions is List) {
      parsedOptions = List<String>.from(rawOptions);
    }
    return CustomField(
      id: map['id'],
      campaignId: map['campaign_id'],
      label: map['field_label'] ?? '',
      type: map['field_type'] ?? 'text',
      isRequired: map['is_required'] ?? false,
      options: parsedOptions,
      displayOrder: map['display_order'] ?? 0,
    );
  }
}
