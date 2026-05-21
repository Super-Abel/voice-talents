import '../../entities/candidature.dart';

abstract class SaveCandidatureUseCase {
  Future<String> execute(Candidature candidature);
}
