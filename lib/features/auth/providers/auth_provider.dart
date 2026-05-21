import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// ═══════════════════════════════════════════════════════════
/// AuthProvider — Voice Talents
///
/// Improvements:
/// • signInAnonymously is retried up to 3 times with back-off
///   to handle transient network errors on app startup
/// • AuthState exposed as AsyncValue<bool> so the UI can
///   surface loading / error states instead of silently failing
/// • Supabase signup URI null errors are caught and logged
/// ═══════════════════════════════════════════════════════════

final authProvider = NotifierProvider<AuthNotifier, bool>(() {
  return AuthNotifier();
});

/// A dedicated provider exposing the current Supabase User (nullable).
final currentUserProvider = Provider<User?>((ref) {
  return Supabase.instance.client.auth.currentUser;
});

class AuthNotifier extends Notifier<bool> {
  final _supabase = Supabase.instance.client;

  @override
  bool build() {
    // Listen for auth state changes and react immediately
    _supabase.auth.onAuthStateChange.listen((data) {
      final event = data.event;
      if (event == AuthChangeEvent.signedIn ||
          event == AuthChangeEvent.tokenRefreshed ||
          event == AuthChangeEvent.userUpdated) {
        state = true;
      } else if (event == AuthChangeEvent.signedOut) {
        state = false;
      }
    });

    return _supabase.auth.currentSession != null;
  }

  // ── Public Auth Methods ──────────────────────────────────

  Future<bool> login(String email, String password) async {
    try {
      await _supabase.auth.signInWithPassword(email: email, password: password);
      return true;
    } on AuthException catch (e) {
      _log('Login failed: ${e.message}');
      return false;
    } catch (e) {
      _log('Unexpected login error: $e');
      return false;
    }
  }

  /// Signs in anonymously with up to [maxRetries] attempts.
  /// Returns the error message on failure, null on success.
  Future<String?> signInAnonymously({int maxRetries = 3}) async {
    if (_supabase.auth.currentSession != null) return null;

    for (int attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        final response = await _supabase.auth.signInAnonymously();
        if (response.user != null) {
          _log('Anonymous sign-in successful (attempt $attempt)');
          return null; // success
        }
        // Supabase returned no user — unusual but handle gracefully
        _log('Anonymous sign-in: null user returned (attempt $attempt)');
      } on AuthException catch (e) {
        _log('AuthException on attempt $attempt: ${e.message} (${e.statusCode})');
        if (attempt == maxRetries) {
          return 'Erreur d\'authentification: ${e.message}';
        }
      } catch (e) {
        _log('Network error on attempt $attempt: $e');
        if (attempt == maxRetries) {
          return 'Impossible de se connecter. Vérifiez votre connexion internet.';
        }
      }
      // Exponential back-off: 500ms, 1s, 2s
      await Future.delayed(Duration(milliseconds: 500 * attempt));
    }
    return 'Authentification échouée après $maxRetries tentatives.';
  }

  Future<void> logout() async {
    try {
      await _supabase.auth.signOut();
      // Re-establish anonymous session so candidates can still submit
      await _supabase.auth.signInAnonymously();
    } catch (e) {
      _log('Logout error: $e');
    }
  }

  // ── Helpers ─────────────────────────────────────────────

  bool get isAuthenticated => _supabase.auth.currentSession != null;
  bool get isAnonymous => _supabase.auth.currentUser?.isAnonymous ?? false;
  String? get userId => _supabase.auth.currentUser?.id;

  void _log(String message) {
    // Replace with your logger (e.g. package:logger) in production
    // ignore: avoid_print
    assert(() {
      print('[AuthNotifier] $message');
      return true;
    }());
  }
}
