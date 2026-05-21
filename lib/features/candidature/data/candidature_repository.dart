import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io' as io;
import '../models/candidature_model.dart';

final candidatureRepositoryProvider = Provider<CandidatureRepository>((ref) {
  return CandidatureRepository();
});

class CandidatureRepository {
  final _supabase = Supabase.instance.client;

  Future<void> saveCandidature(CandidatureModel candidature) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception("Non authentifié");

    // Fetch active campaign if campaignId is not provided
    String? finalCampaignId = candidature.campaignId;
    if (finalCampaignId == null) {
      final campaigns = await _supabase
          .from('campaigns')
          .select('id')
          .eq('is_active', true)
          .limit(1);
      if (campaigns.isNotEmpty) {
        finalCampaignId = campaigns.first['id'];
      } else {
        throw Exception("Aucune campagne de recrutement active trouvée.");
      }
    }

    // Retrieve organization ID from campaign to build the bucket path correctly
    final campaignData = await _supabase
        .from('campaigns')
        .select('organization_id')
        .eq('id', finalCampaignId!)
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
      'reseau_actif': candidature.reseauActif,
      'nombre_abonnes': candidature.nombreAbonnes,
      'telephone_proche': candidature.telephoneProche,
      'quartier': candidature.quartier,
      'application_status': candidature.applicationStatus,
      'consent_accepted': candidature.consentAccepted,
    }).select().single();

    final String appId = appResult['id'];

    // 2. Upload and save files inside the public.application_files table
    if (candidature.video != null) {
      final videoBytes = candidature.video!.bytes;
      final ext = candidature.video!.name.split('.').last;
      // Path: saas_attachments/{organization_id}/{campaign_id}/{user_id}/video.{ext}
      final storagePath = '$orgId/$finalCampaignId/${user.id}/video_$appId.$ext';
      
      if (videoBytes != null) {
        await _supabase.storage.from('saas_attachments').uploadBinary(storagePath, videoBytes);
        await _supabase.from('application_files').insert({
          'application_id': appId,
          'file_type': 'video',
          'storage_path': storagePath,
          'file_size': candidature.video!.size,
          'mime_type': 'video/$ext',
        });
      }
    }

    if (candidature.photo != null) {
      final photoBytes = candidature.photo!.bytes;
      final ext = candidature.photo!.name.split('.').last;
      // Path: saas_attachments/{organization_id}/{campaign_id}/{user_id}/photo.{ext}
      final storagePath = '$orgId/$finalCampaignId/${user.id}/photo_$appId.$ext';
      
      if (photoBytes != null) {
        await _supabase.storage.from('saas_attachments').uploadBinary(storagePath, photoBytes);
        await _supabase.from('application_files').insert({
          'application_id': appId,
          'file_type': 'photo',
          'storage_path': storagePath,
          'file_size': candidature.photo!.size,
          'mime_type': 'image/$ext',
        });
      }
    }

    // 3. Register Consent record for GDPR compliance
    await _supabase.from('consent_records').insert({
      'application_id': appId,
      'consent_version': 'v2.0-SaaS',
    });
  }

  Future<List<CandidatureModel>> getCandidatures() async {
    final response = await _supabase
        .from('applications')
        .select()
        .order('created_at', ascending: false);
        
    List<CandidatureModel> candidatures = [];
    
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
      
      var model = CandidatureModel.fromMap(json);
      candidatures.add(model.copyWith(
        videoUrl: videoUrl,
        photoUrl: photoUrl,
      ));
    }
    
    return candidatures;
  }
  
  Future<void> updateStatus(String applicationId, String newStatus, {String? comment}) async {
    // 1. Update status
    await _supabase.from('applications').update({
      'application_status': newStatus,
    }).eq('id', applicationId);
    
    // 2. Insert internal reviewer comment if provided
    if (comment != null && comment.isNotEmpty) {
      await _supabase.from('application_comments').insert({
        'application_id': applicationId,
        'author_id': _supabase.auth.currentUser!.id,
        'comment_text': comment,
        'is_private_to_recruiters': true,
      });
    }
  }

  Future<void> addScore(String applicationId, int score, {String? notes}) async {
    await _supabase.from('application_reviews').upsert({
      'application_id': applicationId,
      'reviewer_id': _supabase.auth.currentUser!.id,
      'score': score,
      'evaluation_notes': notes,
    });
  }

  /// Remplace la photo ou vidéo d'une candidature.
  /// Supprime l'ancien fichier du Storage, uploade le nouveau, met à jour application_files.
  /// Retourne l'URL signée du nouveau fichier.
  Future<String> updateFile({
    required String applicationId,
    required String fileType, // 'photo' ou 'video'
    required PlatformFile file,
  }) async {
    // 1. Récupérer l'ancien enregistrement
    final existing = await _supabase
        .from('application_files')
        .select('id, storage_path')
        .eq('application_id', applicationId)
        .eq('file_type', fileType)
        .maybeSingle();

    // 2. Supprimer l'ancien fichier du Storage s'il existe
    if (existing != null) {
      final oldPath = existing['storage_path'] as String;
      await _supabase.storage.from('saas_attachments').remove([oldPath]);
    }

    // 3. Construire le nouveau chemin à partir de l'ancien ou de l'appId
    final ext = file.name.split('.').last.toLowerCase();
    final String newPath;
    if (existing != null) {
      // Même dossier, nouveau nom avec timestamp pour éviter le cache CDN
      final dir = (existing['storage_path'] as String).split('/')
          .sublist(0, 3)
          .join('/');
      newPath = '$dir/${fileType}_${applicationId}_${DateTime.now().millisecondsSinceEpoch}.$ext';
    } else {
      newPath = 'uploads/$applicationId/${fileType}_${DateTime.now().millisecondsSinceEpoch}.$ext';
    }

    // 4. Uploader le nouveau fichier
    if (kIsWeb || file.bytes != null) {
      await _supabase.storage.from('saas_attachments').uploadBinary(newPath, file.bytes!);
    } else if (file.path != null) {
      await _supabase.storage.from('saas_attachments').upload(newPath, io.File(file.path!));
    }

    // 5. Mettre à jour ou insérer dans application_files
    final fileRow = {
      'application_id': applicationId,
      'file_type': fileType,
      'storage_path': newPath,
      'file_size': file.size,
      'mime_type': fileType == 'photo' ? 'image/$ext' : 'video/$ext',
    };

    if (existing != null) {
      await _supabase
          .from('application_files')
          .update(fileRow)
          .eq('id', existing['id']);
    } else {
      await _supabase.from('application_files').insert(fileRow);
    }

    // 6. Retourner une URL signée fraîche (1 heure)
    return _supabase.storage.from('saas_attachments').createSignedUrl(newPath, 3600);
  }
}
