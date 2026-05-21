abstract class UpdateStatusUseCase {
  Future<void> execute(String id, String status, {String? comment});
}
