import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../models/candidature_model.dart';
import '../data/candidature_repository.dart';

final candidatureProvider = NotifierProvider<CandidatureNotifier, CandidatureModel>(() {
  return CandidatureNotifier();
});

class CandidatureNotifier extends Notifier<CandidatureModel> {
  @override
  CandidatureModel build() {
    return const CandidatureModel();
  }

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

  Future<String?> pickVideo() async {
    FilePickerResult? result = await FilePicker.pickFiles(
      type: FileType.video,
      withData: true,
    );
    
    if (result != null) {
      final file = result.files.single;
      // Check file size (10 MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return 'La vidéo dépasse la limite de 10 Mo.';
      }
      state = state.copyWith(video: file);
      return null;
    }
    return 'Sélection annulée';
  }

  Future<String?> pickPhoto() async {
    FilePickerResult? result = await FilePicker.pickFiles(
      type: FileType.image,
      withData: true,
    );
    
    if (result != null) {
      final file = result.files.single;
      // Check file size (10 MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return 'La photo dépasse la limite de 10 Mo.';
      }
      state = state.copyWith(photo: file);
      return null;
    }
    return 'Sélection annulée';
  }

  Future<bool> submit() async {
    try {
      final repository = ref.read(candidatureRepositoryProvider);
      await repository.saveCandidature(state);
      
      // Réinitialiser le formulaire après succès
      state = const CandidatureModel();
      return true;
    } catch (e) {
      return false;
    }
  }
}
