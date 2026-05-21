class CustomResponse {
  final String? id;
  final String applicationId;
  final String fieldId;
  final String value;

  const CustomResponse({
    this.id,
    required this.applicationId,
    required this.fieldId,
    required this.value,
  });

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'application_id': applicationId,
      'field_id': fieldId,
      'response_value': value,
    };
  }

  factory CustomResponse.fromMap(Map<String, dynamic> map) {
    return CustomResponse(
      id: map['id'],
      applicationId: map['application_id'] ?? '',
      fieldId: map['field_id'] ?? '',
      value: map['response_value'] ?? '',
    );
  }
}
