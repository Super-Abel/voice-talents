import 'dart:io' as io;
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/entities/candidature.dart';
import '../../domain/entities/custom_field.dart';
import '../../domain/ports/out/candidature_repository_port.dart';

class SupabaseCandidatureRepositoryAdapter implements CandidatureRepositoryPort {
  final _supabase = Supabase.instance.client;

  @override
  Future<String> getActiveCampaignId() async {
    final campaigns = await _supabase
        .from('campaigns')
        .select('id')
        .eq('is_active', true)
        .limit(1);
    if (campaigns.isEmpty) {
      throw Exception("Aucune campagne de recrutement active trouvée.");
    }
    return campaigns.first['id'] as String;
  }

  @override
  Future<String> save(Candidature candidature) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception("Non authentifié");

    // Use the campaignId already set on the entity (resolved before submit)
    final String? finalCampaignId = candidature.campaignId;
    if (finalCampaignId == null) {
      throw Exception("Aucune campagne de recrutement active trouvée.");
    }

    // Retrieve organization ID from campaign to build the bucket path correctly
    final campaignData = await _supabase
        .from('campaigns')
        .select('organization_id')
        .eq('id', finalCampaignId)
        .single();
    final String orgId = campaignData['organization_id'];

    // 1. Insert Application first to get application ID
    final appResult = await _supabase.from('applications').insert({
      'campaign_id': finalCampaignId,
      'user_id': user.id,
      'nom_prenom': candidature.nomPrenom,
      'whatsapp': candidature.whatsapp,
      'age': candidature.age,
      'sexe': candidature.sexe,
      'statut': candidature.statut.isEmpty ? 'Non renseigné' : candidature.statut,
      'reseau_actif': candidature.reseauActif,
      'nombre_abonnes': candidature.nombreAbonnes,
      if (candidature.lienReseau != null && candidature.lienReseau!.isNotEmpty)
        'lien_reseau': candidature.lienReseau,
      'telephone_proche': candidature.telephoneProche,
      'quartier': candidature.quartier,
      'application_status': candidature.applicationStatus,
      'consent_accepted': candidature.consentAccepted,
    }).select().single();

    final String appId = appResult['id'];

    // Helper for cross-platform upload (Web & Native iOS/Android/Linux/macOS/Windows)
    Future<void> uploadMedia(String fileType, dynamic domainFile) async {
      if (domainFile == null) return;
      final ext = domainFile.name.split('.').last;
      final storagePath = '$orgId/$finalCampaignId/${user.id}/${fileType}_$appId.$ext';

      if (kIsWeb || domainFile.bytes != null) {
        // Web / In-Memory
        await _supabase.storage.from('saas_attachments').uploadBinary(storagePath, domainFile.bytes!);
      } else if (domainFile.path != null) {
        // Native platforms (Android, iOS, Linux, Desktop)
        final nativeFile = io.File(domainFile.path!);
        await _supabase.storage.from('saas_attachments').upload(storagePath, nativeFile);
      }

      await _supabase.from('application_files').insert({
        'application_id': appId,
        'file_type': fileType,
        'storage_path': storagePath,
        'file_size': domainFile.size,
        'mime_type': fileType == 'photo' ? 'image/$ext' : 'video/$ext',
      });
    }

    // 2. Upload files in parallel — roll back the application row if either fails
    try {
      await Future.wait([
        if (candidature.video != null) uploadMedia('video', candidature.video),
        if (candidature.photo != null) uploadMedia('photo', candidature.photo),
      ]);
    } catch (e) {
      // Clean up the orphaned application row before re-throwing
      await _supabase.from('applications').delete().eq('id', appId);
      rethrow;
    }

    // 3. Insert custom responses if any (skip demo field IDs)
    final realResponses = candidature.customResponses
        .where((r) => r.fieldId.isNotEmpty && !r.fieldId.startsWith('demo-'))
        .toList();
    if (realResponses.isNotEmpty) {
      await _supabase.from('application_custom_responses').insert(
        realResponses.map((r) => {
          'application_id': appId,
          'field_id': r.fieldId,
          'response_value': r.value,
        }).toList(),
      );
    }

    // 4. Register Consent record for GDPR compliance
    await _supabase.from('consent_records').insert({
      'application_id': appId,
      'consent_version': 'v2.0-Hexagonal-SaaS',
    });

    return appId;
  }

  @override
  Future<List<Candidature>> getAll() async {
    final response = await _supabase
        .from('applications')
        .select()
        .order('created_at', ascending: false);
        
    List<Candidature> candidatures = [];
    
    for (var json in response) {
      String? videoUrl;
      String? photoUrl;
      final String appId = json['id'];

      // Fetch attached files from public.application_files
      final filesResponse = await _supabase
          .from('application_files')
          .select()
          .eq('application_id', appId);

      for (var file in filesResponse) {
        final String path = file['storage_path'];
        final String type = file['file_type'];
        // Generate a 1-hour signed URL securely
        final signedUrl = await _supabase.storage.from('saas_attachments').createSignedUrl(path, 3600);
        if (type == 'video') {
          videoUrl = signedUrl;
        } else if (type == 'photo') {
          photoUrl = signedUrl;
        }
      }
      
      candidatures.add(Candidature(
        id: json['id'],
        campaignId: json['campaign_id'],
        userId: json['user_id'],
        nomPrenom: json['nom_prenom'] ?? '',
        whatsapp: json['whatsapp'] ?? '',
        age: json['age'],
        sexe: json['sexe'] ?? '',
        statut: json['statut'] ?? '',
        reseauActif: json['reseau_actif'] ?? '',
        nombreAbonnes: json['nombre_abonnes'] ?? '',
        lienReseau: json['lien_reseau'],
        telephoneProche: json['telephone_proche'] ?? '',
        quartier: json['quartier'] ?? '',
        applicationStatus: json['application_status'] ?? 'soumis',
        consentAccepted: json['consent_accepted'] ?? false,
        videoUrl: videoUrl,
        photoUrl: photoUrl,
        createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      ));
    }
    
    return candidatures;
  }
  
  @override
  Future<void> updateStatus(String id, String status, {String? comment}) async {
    await _supabase.from('applications').update({
      'application_status': status,
    }).eq('id', id);
    
    if (comment != null && comment.isNotEmpty) {
      await _supabase.from('application_comments').insert({
        'application_id': id,
        'author_id': _supabase.auth.currentUser!.id,
        'comment_text': comment,
        'is_private_to_recruiters': true,
      });
    }
  }

  @override
  Future<void> addScore(String id, int score, {String? notes}) async {
    await _supabase.from('application_reviews').upsert({
      'application_id': id,
      'reviewer_id': _supabase.auth.currentUser!.id,
      'score': score,
      'evaluation_notes': notes,
    });
  }

  @override
  Future<List<CustomField>> getCustomFields(String campaignId) async {
    final response = await _supabase
        .from('campaign_custom_fields')
        .select()
        .eq('campaign_id', campaignId)
        .order('display_order', ascending: true);
    
    return response.map((map) => CustomField.fromMap(map)).toList();
  }

  @override
  Future<List<Map<String, dynamic>>> getStatusHistory(String applicationId) async {
    final response = await _supabase
        .from('application_status_history')
        .select()
        .eq('application_id', applicationId)
        .order('created_at', ascending: true);
    
    return List<Map<String, dynamic>>.from(response);
  }

  @override
  Future<List<Map<String, dynamic>>> getWhatsAppLogs(String applicationId) async {
    final response = await _supabase
        .from('whatsapp_logs')
        .select()
        .eq('application_id', applicationId)
        .order('created_at', ascending: false);
    
    return List<Map<String, dynamic>>.from(response);
  }
}
