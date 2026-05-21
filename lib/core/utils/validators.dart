/// ═══════════════════════════════════════════════════════════
/// Validators — Voice Talents
/// Secure, rigorous, XSS/injection-resistant form validation.
/// All validators follow Flutter's FormField<String?> signature.
/// ═══════════════════════════════════════════════════════════
class Validators {
  Validators._();

  // ─── constants ────────────────────────────────────────────
  static const int _minAge = 18;
  static const int _maxAge = 35;
  static const int _minPhoneLength = 8;
  static const int _maxPhoneLength = 20;
  static const int _maxNameLength = 100;
  static const int _maxTextLength = 2000;

  /// Characters considered dangerous for injection / XSS.
  static final RegExp _dangerousChars = RegExp("[<>'\"\\\\;{}\\[\\]|`]");

  /// International phone number: optional +, then digits / spaces / dashes / dots.
  static final RegExp _phoneRegex = RegExp(r'^\+?[\d\s\-().]{8,20}$');

  /// Minimal "real name" pattern (letters, spaces, hyphens, accented chars).
  static final RegExp _nameRegex = RegExp(
    r"^[\p{L}\s'\-\.]{2,100}$",
    unicode: true,
  );

  // ─── generic helpers ──────────────────────────────────────

  /// Returns an error string if [value] contains dangerous characters.
  static String? _checkDangerous(String value) {
    if (_dangerousChars.hasMatch(value)) {
      return 'Caractères non autorisés détectés';
    }
    return null;
  }

  /// Sanitizes leading/trailing whitespace and normalizes inner spaces.
  static String sanitize(String? raw) =>
      (raw ?? '').trim().replaceAll(RegExp(r'\s+'), ' ');

  // ─── public validators ────────────────────────────────────

  /// Generic required field — rejects empty / whitespace-only strings.
  static String? required(String? value, {String message = 'Ce champ est requis'}) {
    final v = sanitize(value);
    if (v.isEmpty) return message;
    if (_dangerousChars.hasMatch(v)) return 'Caractères non autorisés';
    return null;
  }

  /// Full name: 2–100 chars, letters + accented chars + spaces/hyphens/dots.
  static String? fullName(String? value) {
    final v = sanitize(value);
    if (v.isEmpty) return 'Le nom complet est requis';
    if (v.length < 2) return 'Le nom doit contenir au moins 2 caractères';
    if (v.length > _maxNameLength) return 'Le nom est trop long';
    if (!_nameRegex.hasMatch(v)) return 'Veuillez entrer un nom valide (lettres uniquement)';
    return null;
  }

  /// Age: integer between 18 and 35 (inclusive).
  static String? age(String? value) {
    final v = sanitize(value);
    if (v.isEmpty) return 'L\'âge est requis';
    final ageInt = int.tryParse(v);
    if (ageInt == null) return 'Veuillez entrer un nombre valide';
    if (ageInt < _minAge) return 'L\'âge minimum est $_minAge ans';
    if (ageInt > _maxAge) return 'L\'âge maximum est $_maxAge ans';
    return null;
  }

  /// Phone number: must be a valid Cameroon phone number (9 digits starting with 6 or 2, optionally prefixed with +237 or 237).
  static String? phone(String? value) {
    final v = sanitize(value);
    if (v.isEmpty) return 'Le numéro de téléphone est requis';

    // Remove all whitespace, dashes, parentheses, and dots for analysis
    final clean = v.replaceAll(RegExp(r'[\s\-().]'), '');

    // Pattern: optional +237 or 237, followed by a 6 (mobile) or 2 (fixed), then 8 digits
    final cameroonRegex = RegExp(r'^(\+237|237)?[62]\d{8}$');

    if (!cameroonRegex.hasMatch(clean)) {
      return 'Numéro camerounais invalide — ex: +237 6xx xxx xxx ou 6xx xxx xxx';
    }
    return null;
  }

  /// Optional phone — valid only if non-empty.
  static String? optionalPhone(String? value) {
    final v = sanitize(value);
    if (v.isEmpty) return null; // field is optional
    return phone(v);
  }

  /// Long text (textarea): max 2000 chars, no dangerous characters.
  static String? longText(String? value, {bool isRequired = false}) {
    final v = sanitize(value);
    if (isRequired && v.isEmpty) return 'Ce champ est requis';
    if (v.length > _maxTextLength) {
      return 'Texte trop long (max $_maxTextLength caractères)';
    }
    final dangerous = _checkDangerous(v);
    if (dangerous != null) return dangerous;
    return null;
  }

  /// Dropdown: must have a non-null, non-empty selection.
  static String? dropdown(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Veuillez faire une sélection';
    }
    return null;
  }

  /// Number field: positive integer, optional min/max range.
  static String? number(
    String? value, {
    bool isRequired = false,
    int? min,
    int? max,
  }) {
    final v = sanitize(value);
    if (v.isEmpty) {
      return isRequired ? 'Ce champ est requis' : null;
    }
    final n = int.tryParse(v);
    if (n == null) return 'Veuillez entrer un nombre entier valide';
    if (min != null && n < min) return 'La valeur minimale est $min';
    if (max != null && n > max) return 'La valeur maximale est $max';
    return null;
  }

  /// Consent checkbox: must be explicitly accepted.
  static String? consent(bool? value) {
    if (value != true) return 'Vous devez accepter les conditions pour continuer';
    return null;
  }

  /// Comment / long answer: required, min chars, max 2000 chars.
  static String? comment(String? value, {int minChars = 50}) {
    final v = sanitize(value);
    if (v.isEmpty) return 'Ce champ est requis';
    if (v.length < minChars) return 'Minimum $minChars caractères requis (actuellement ${v.length})';
    if (v.length > _maxTextLength) return 'Texte trop long (max $_maxTextLength caractères)';
    final dangerous = _checkDangerous(v);
    if (dangerous != null) return dangerous;
    return null;
  }

  /// Neighborhood / city: letters, spaces, hyphens, numbers allowed.
  static String? neighborhood(String? value) {
    final v = sanitize(value);
    if (v.isEmpty) return 'Le quartier est requis';
    if (v.length < 2) return 'Veuillez entrer un quartier valide';
    if (v.length > 100) return 'Trop long (max 100 caractères)';
    final dangerous = _checkDangerous(v);
    if (dangerous != null) return dangerous;
    return null;
  }

  /// Optional URL validator. If provided, must be a valid URL format.
  static String? optionalUrl(String? value) {
    final v = sanitize(value);
    if (v.isEmpty) return null; // field is optional
    
    // Standard URL regex (allows optional http/https)
    final urlRegex = RegExp(
      r'^(https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$',
      caseSensitive: false,
    );
    
    if (!urlRegex.hasMatch(v)) {
      return 'Veuillez entrer un lien web valide';
    }
    return null;
  }
}
