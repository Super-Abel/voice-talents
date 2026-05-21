import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';

@immutable
class CandidatureModel {
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
  final PlatformFile? video;
  final PlatformFile? photo;
  final String? videoUrl;
  final String? photoUrl;
  final String telephoneProche;
  final String quartier;
  final String applicationStatus; // 'brouillon', 'soumis', 'en_revue', 'preselectionne', 'rejete', 'retenu'
  final bool consentAccepted;
  final DateTime? createdAt;

  const CandidatureModel({
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
    this.video,
    this.photo,
    this.videoUrl,
    this.photoUrl,
    this.telephoneProche = '',
    this.quartier = '',
    this.applicationStatus = 'soumis',
    this.consentAccepted = false,
    this.createdAt,
  });

  CandidatureModel copyWith({
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
    PlatformFile? video,
    PlatformFile? photo,
    String? videoUrl,
    String? photoUrl,
    String? telephoneProche,
    String? quartier,
    String? applicationStatus,
    bool? consentAccepted,
    DateTime? createdAt,
  }) {
    return CandidatureModel(
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
      video: video ?? this.video,
      photo: photo ?? this.photo,
      videoUrl: videoUrl ?? this.videoUrl,
      photoUrl: photoUrl ?? this.photoUrl,
      telephoneProche: telephoneProche ?? this.telephoneProche,
      quartier: quartier ?? this.quartier,
      applicationStatus: applicationStatus ?? this.applicationStatus,
      consentAccepted: consentAccepted ?? this.consentAccepted,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      if (campaignId != null) 'campaign_id': campaignId,
      if (userId != null) 'user_id': userId,
      'nom_prenom': nomPrenom,
      'whatsapp': whatsapp,
      'age': age,
      'sexe': sexe,
      'statut': statut,
      'reseau_actif': reseauActif,
      'nombre_abonnes': nombreAbonnes,
      'telephone_proche': telephoneProche,
      'quartier': quartier,
      'application_status': applicationStatus,
      'consent_accepted': consentAccepted,
    };
  }

  factory CandidatureModel.fromMap(Map<String, dynamic> map) {
    return CandidatureModel(
      id: map['id'],
      campaignId: map['campaign_id'],
      userId: map['user_id'],
      nomPrenom: map['nom_prenom'] ?? '',
      whatsapp: map['whatsapp'] ?? '',
      age: map['age'],
      sexe: map['sexe'] ?? '',
      statut: map['statut'] ?? '',
      reseauActif: map['reseau_actif'] ?? '',
      nombreAbonnes: map['nombre_abonnes'] ?? '',
      telephoneProche: map['telephone_proche'] ?? '',
      quartier: map['quartier'] ?? '',
      applicationStatus: map['application_status'] ?? 'soumis',
      consentAccepted: map['consent_accepted'] ?? false,
      createdAt: map['created_at'] != null ? DateTime.parse(map['created_at']) : null,
    );
  }
}
