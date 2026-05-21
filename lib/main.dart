import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/theme/app_theme.dart';
import 'core/routing/app_router.dart';
import 'core/localization/translation_provider.dart';

/// ═══════════════════════════════════════════════════════════
/// App Entry Point — Voice Talents
/// ═══════════════════════════════════════════════════════════
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait on mobile if needed (remove for web-only)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // 1. Load translations before anything renders
  await TranslationLoader.load();

  // 2. Load environment variables
  await dotenv.load(fileName: '.env');

  // 3. Initialize Supabase — guard against missing env vars
  final supabaseUrl = dotenv.env['SUPABASE_URL'];
  final supabaseKey = dotenv.env['SUPABASE_ANON_KEY'];

  if (supabaseUrl == null || supabaseUrl.isEmpty ||
      supabaseKey == null || supabaseKey.isEmpty) {
    throw FlutterError(
      '[Voice Talents] SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env.\n'
      'Copy .env.example to .env and fill in your credentials.',
    );
  }

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseKey,
    // Debug logs only in non-production builds
    debug: false,
  );

  // 4. Anonymous sign-in with retry — do NOT crash the app on failure.
  //    The candidature repository will detect the missing auth and
  //    surface a readable error to the user at submission time.
  final supabase = Supabase.instance.client;
  if (supabase.auth.currentSession == null) {
    try {
      const maxRetries = 3;
      for (int i = 1; i <= maxRetries; i++) {
        try {
          await supabase.auth.signInAnonymously();
          break; // success
        } on AuthException catch (e) {
          debugPrint('[main] Auth attempt $i failed: ${e.message} (${e.statusCode})');
          if (i == maxRetries) rethrow;
          await Future.delayed(Duration(milliseconds: 500 * i));
        }
      }
    } catch (e) {
      // Non-fatal: the app still loads; the user will see an error on submit.
      debugPrint('[main] Anonymous sign-in failed after retries: $e');
    }
  }

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Candidature — Voice Talents',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}
