import 'package:flutter_test/flutter_test.dart';
import 'package:candidature/core/utils/validators.dart';

void main() {
  group('Validators.phone (Cameroon Numbers)', () {
    test('Valid Mobile Numbers without country code', () {
      expect(Validators.phone('677889900'), isNull);
      expect(Validators.phone('699123456'), isNull);
      expect(Validators.phone('655555555'), isNull);
      expect(Validators.phone('666666666'), isNull);
    });

    test('Valid Mobile Numbers with country code (+237)', () {
      expect(Validators.phone('+237677889900'), isNull);
      expect(Validators.phone('+237 699 12 34 56'), isNull);
      expect(Validators.phone('+237-6-55-55-55-55'), isNull);
      expect(Validators.phone('+237 (666) 66-66-66'), isNull);
    });

    test('Valid Mobile Numbers with country code (237) without plus', () {
      expect(Validators.phone('237677889900'), isNull);
      expect(Validators.phone('237 699 123 456'), isNull);
    });

    test('Valid Fixed Line Numbers', () {
      expect(Validators.phone('222334455'), isNull);
      expect(Validators.phone('+237 233 44 55 66'), isNull);
      expect(Validators.phone('237 242 11 22 33'), isNull);
    });

    test('Invalid Numbers - Empty or spaces only', () {
      expect(Validators.phone(''), equals('Le numéro de téléphone est requis'));
      expect(Validators.phone('   '), equals('Le numéro de téléphone est requis'));
    });

    test('Invalid Numbers - Wrong starting digits', () {
      // Numbers starting with 5, 7, 8, 9, etc., are not valid Cameroon phone numbers
      expect(Validators.phone('577889900'), startsWith('Numéro camerounais invalide'));
      expect(Validators.phone('999123456'), startsWith('Numéro camerounais invalide'));
      expect(Validators.phone('+237 777889900'), startsWith('Numéro camerounais invalide'));
    });

    test('Invalid Numbers - Too short or too long', () {
      expect(Validators.phone('67788990'), startsWith('Numéro camerounais invalide')); // 8 digits
      expect(Validators.phone('6778899001'), startsWith('Numéro camerounais invalide')); // 10 digits
      expect(Validators.phone('+237 67788990'), startsWith('Numéro camerounais invalide')); // 8 digits
      expect(Validators.phone('+237 6778899001'), startsWith('Numéro camerounais invalide')); // 10 digits
    });

    test('Invalid Numbers - Wrong country code', () {
      expect(Validators.phone('+33 677889900'), startsWith('Numéro camerounais invalide')); // France
      expect(Validators.phone('+234 677889900'), startsWith('Numéro camerounais invalide')); // Nigeria
    });
  });
}
