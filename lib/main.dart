import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/theme/app_theme.dart';
import 'core/routing/app_router.dart';
import 'core/localization/translation_provider.dart';

/// ═══════════════════════════════════════════════════════════
/// App Entry Point — Voice Talents
/// ═══════════════════════════════════════════════════════════
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Disable dynamic font downloading to prevent connection timeouts when offline/behind firewall
  GoogleFonts.config.allowRuntimeFetching = false;

  // Lock to portrait on mobile if needed (remove for web-only)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // 1. Load translations before anything renders
  await TranslationLoader.load();

  // 2. Load environment variables
  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    debugPrint('[main] Could not load .env file: $e');
  }

  // 3. Initialize Supabase — guard against missing env vars
  final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? 
      const String.fromEnvironment('SUPABASE_URL');
  final supabaseKey = dotenv.env['SUPABASE_ANON_KEY'] ?? 
      const String.fromEnvironment('SUPABASE_ANON_KEY');

  if (supabaseUrl.isEmpty || supabaseKey.isEmpty) {
    runApp(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 64),
                  const SizedBox(height: 16),
                  const Text(
                    'Configuration Error',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'SUPABASE_URL or SUPABASE_ANON_KEY is missing.\n'
                    'Please make sure they are defined in your .env file or build environment.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    return;
  }

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseKey,
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
