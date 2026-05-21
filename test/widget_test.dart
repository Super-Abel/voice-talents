import 'package:flutter_test/flutter_test.dart';
import 'package:candidature/features/candidature/domain/entities/candidature.dart';

void main() {
  group('Candidature Entity Tests', () {
    test('should copyWith all fields correctly', () {
      const candidature = Candidature(
        nomPrenom: 'Marc Momo',
        whatsapp: '677777777',
      );

      final updated = candidature.copyWith(
        nomPrenom: 'Jean Dupont',
        applicationStatus: 'en_revue',
      );

      expect(updated.nomPrenom, 'Jean Dupont');
      expect(updated.whatsapp, '677777777');
      expect(updated.applicationStatus, 'en_revue');
    });
  });
}
