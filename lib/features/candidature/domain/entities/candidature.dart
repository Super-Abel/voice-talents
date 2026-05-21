import 'domain_file.dart';
import 'custom_response.dart';

// Sentinel value used to explicitly pass `null` into copyWith for nullable fields.
// This pattern is necessary because `null ?? existing` always returns `existing`.
const _sentinel = Object();

class Candidature {
  final String? id;
  final String? campaignId;
  final String? userId;
  final String nomPrenom;
  final String whatsapp;
  final int? age;
  final String sexe;
  final String statut;
  final String reseauActif;
  final String nombreAbonnes;
  final String? lienReseau;
  final DomainFile? video;
  final DomainFile? photo;
  final String? videoUrl;
  final String? photoUrl;
  final String telephoneProche;
  final String quartier;
  final String applicationStatus;
  final bool consentAccepted;
  final DateTime? createdAt;
  final List<CustomResponse> customResponses;

  const Candidature({
    this.id,
    this.campaignId,
    this.userId,
    this.nomPrenom = '',
    this.whatsapp = '',
    this.age,
    this.sexe = '',
    this.statut = '',
    this.reseauActif = '',
    this.nombreAbonnes = '',
    this.lienReseau,
    this.video,
    this.photo,
    this.videoUrl,
    this.photoUrl,
    this.telephoneProche = '',
    this.quartier = '',
    this.applicationStatus = 'soumis',
    this.consentAccepted = false,
    this.createdAt,
    this.customResponses = const [],
  });

  /// Copies the entity. Use [Object()] sentinel constants (e.g. [clearVideo])
  /// to explicitly set nullable fields to null.
  Candidature copyWith({
    String? id,
    String? campaignId,
    String? userId,
    String? nomPrenom,
    String? whatsapp,
    int? age,
    String? sexe,
    String? statut,
    String? reseauActif,
    String? nombreAbonnes,
    String? lienReseau,
    // Use Object? + default sentinel to allow setting to null
    Object? video = _sentinel,
    Object? photo = _sentinel,
    String? videoUrl,
    String? photoUrl,
    String? telephoneProche,
    String? quartier,
    String? applicationStatus,
    bool? consentAccepted,
    DateTime? createdAt,
    List<CustomResponse>? customResponses,
  }) {
    return Candidature(
      id: id ?? this.id,
      campaignId: campaignId ?? this.campaignId,
      userId: userId ?? this.userId,
      nomPrenom: nomPrenom ?? this.nomPrenom,
      whatsapp: whatsapp ?? this.whatsapp,
      age: age ?? this.age,
      sexe: sexe ?? this.sexe,
      statut: statut ?? this.statut,
      reseauActif: reseauActif ?? this.reseauActif,
      nombreAbonnes: nombreAbonnes ?? this.nombreAbonnes,
      lienReseau: lienReseau ?? this.lienReseau,
      // Sentinel pattern: if caller passed null explicitly → null; else keep existing
      video: identical(video, _sentinel) ? this.video : video as DomainFile?,
      photo: identical(photo, _sentinel) ? this.photo : photo as DomainFile?,
      videoUrl: videoUrl ?? this.videoUrl,
      photoUrl: photoUrl ?? this.photoUrl,
      telephoneProche: telephoneProche ?? this.telephoneProche,
      quartier: quartier ?? this.quartier,
      applicationStatus: applicationStatus ?? this.applicationStatus,
      consentAccepted: consentAccepted ?? this.consentAccepted,
      createdAt: createdAt ?? this.createdAt,
      customResponses: customResponses ?? this.customResponses,
    );
  }

  /// Whether this candidature is complete enough to submit.
  bool get isReadyToSubmit =>
      nomPrenom.trim().isNotEmpty &&
      whatsapp.trim().isNotEmpty &&
      age != null &&
      sexe.isNotEmpty &&
      statut.isNotEmpty &&
      consentAccepted;

  @override
  String toString() =>
      'Candidature(id: $id, nomPrenom: $nomPrenom, status: $applicationStatus)';
}
