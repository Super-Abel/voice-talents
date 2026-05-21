import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/candidature/presentation/screens/candidature_screen.dart';
import '../../features/candidature/presentation/screens/success_screen.dart';
import '../../features/candidature/presentation/screens/tracking_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/admin/presentation/screens/admin_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/auth/providers/auth_provider.dart';

/// True only when a real (non-anonymous) admin session is active.
final isAdminAuthProvider = Provider<bool>((ref) {
  ref.watch(authProvider); // rebuild on auth changes
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return false;
  return user.isAnonymous != true && user.email != null;
});

final appRouterProvider = Provider<GoRouter>((ref) {
  // Sur Flutter Web, lire l'URL réelle du browser au démarrage
  final initialLocation = Uri.base.path.isEmpty ? '/' : Uri.base.path;

  return GoRouter(
    initialLocation: initialLocation,
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) {
          debugPrint('[BUILD] CandidatureScreen uri=${state.uri}');
          return const CandidatureScreen();
        },
      ),
      GoRoute(
        path: '/success',
        builder: (context, state) => SuccessScreen(
          applicationId: state.uri.queryParameters['id'],
        ),
      ),
      GoRoute(
        path: '/tracking',
        builder: (context, state) => const TrackingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) {
          debugPrint('[BUILD] LoginScreen uri=${state.uri}');
          return const LoginScreen();
        },
      ),
      GoRoute(
        path: '/admin',
        redirect: (context, state) {
          final user = Supabase.instance.client.auth.currentUser;
          final isAdmin = user != null && user.isAnonymous != true && user.email != null;
          debugPrint('[REDIRECT /admin] isAdmin=$isAdmin email=${user?.email} anon=${user?.isAnonymous}');
          return isAdmin ? null : '/login';
        },
        builder: (context, state) => const AdminScreen(),
      ),
    ],
  );
});

