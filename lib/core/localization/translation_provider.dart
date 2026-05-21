import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../assets/app_assets.dart';

enum Language { fr, en }

/// Dynamic JSON-based Translation Loader.
/// Preloads translation maps asynchronously during application bootstrap.
class TranslationLoader {
  static final Map<Language, Map<String, String>> _localizedStrings = {};

  static Future<void> load() async {
    try {
      final frContent = await rootBundle.loadString(AppAssets.langFr);
      final Map<String, dynamic> frJson = json.decode(frContent);
      _localizedStrings[Language.fr] = frJson.map((key, value) => MapEntry(key, value.toString()));
    } catch (e) {
      // Fallback in case of asset loading failure
      _localizedStrings[Language.fr] = {};
    }

    try {
      final enContent = await rootBundle.loadString(AppAssets.langEn);
      final Map<String, dynamic> enJson = json.decode(enContent);
      _localizedStrings[Language.en] = enJson.map((key, value) => MapEntry(key, value.toString()));
    } catch (e) {
      // Fallback in case of asset loading failure
      _localizedStrings[Language.en] = {};
    }
  }

  static bool get isLoaded =>
      _localizedStrings.containsKey(Language.fr) &&
      _localizedStrings[Language.fr]!.isNotEmpty;

  static String translate(String key, Language language) {
    // Guard: if map is empty (e.g. after hot-reload on web), trigger reload
    if (!isLoaded) {
      // Synchronous fallback — return key and schedule async reload
      load();
      return key;
    }
    return _localizedStrings[language]?[key] ?? key;
  }
}

final languageProvider = NotifierProvider<LanguageNotifier, Language>(() {
  return LanguageNotifier();
});

class LanguageNotifier extends Notifier<Language> {
  @override
  Language build() {
    return Language.fr;
  }

  void toggleLanguage() {
    state = state == Language.fr ? Language.en : Language.fr;
  }

  void setLanguage(Language lang) {
    state = lang;
  }
}

// FutureProvider that ensures translations are loaded before any widget uses them
final translationLoaderProvider = FutureProvider<void>((ref) async {
  if (!TranslationLoader.isLoaded) {
    await TranslationLoader.load();
  }
});

final translationProvider = Provider<TranslationService>((ref) {
  // Depend on the loader so widgets rebuild once translations are ready
  ref.watch(translationLoaderProvider);
  final lang = ref.watch(languageProvider);
  return TranslationService(lang);
});

class TranslationService {
  final Language language;
  
  TranslationService(this.language);

  String translate(String key) {
    return TranslationLoader.translate(key, language);
  }
}
