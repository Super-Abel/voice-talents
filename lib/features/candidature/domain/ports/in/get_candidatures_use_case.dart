import '../../entities/candidature.dart';

abstract class GetCandidaturesUseCase {
  Future<List<Candidature>> execute();
}
