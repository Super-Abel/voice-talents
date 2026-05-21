import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/design_system.dart';
import '../../providers/auth_provider.dart';
import '../../../candidature/presentation/widgets/custom_text_field.dart';
import '../../../../core/localization/translation_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  String _email = '';
  String _password = '';
  bool _isLoading = false;

  Future<void> _login() async {
    final trans = ref.read(translationProvider);
    if (_email.isEmpty || _password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(trans.translate('err_fill_all_fields')),
          backgroundColor: AppDesignSystem.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    final success = await ref.read(authProvider.notifier).login(_email.trim(), _password);
    
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (success) {
      context.go('/admin');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(trans.translate('err_incorrect_credentials')),
          backgroundColor: AppDesignSystem.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final trans = ref.watch(translationProvider);
    final lang = ref.watch(languageProvider);

    return Scaffold(
      backgroundColor: AppDesignSystem.backgroundAlt,
      appBar: AppBar(
        title: Text(
          trans.translate('admin_access'),
          style: AppDesignSystem.titleSmall.copyWith(color: AppDesignSystem.primary),
        ),
        backgroundColor: AppDesignSystem.background,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Center(
              child: GestureDetector(
                onTap: () => ref.read(languageProvider.notifier).toggleLanguage(),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppDesignSystem.primary.withOpacity(0.08),
                    border: Border.all(color: AppDesignSystem.primary.withOpacity(0.2)),
                    borderRadius: AppDesignSystem.borderSmall,
                  ),
                  child: Text(
                    lang.name.toUpperCase(),
                    style: AppDesignSystem.labelStyle.copyWith(
                      color: AppDesignSystem.primary,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
          )
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Card(
              margin: const EdgeInsets.all(24),
              shape: RoundedRectangleBorder(
                borderRadius: AppDesignSystem.borderLarge,
              ),
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(
                      Icons.admin_panel_settings_rounded,
                      size: 80,
                      color: AppDesignSystem.primary,
                    ),
                    AppDesignSystem.spacingMD(),
                    Text(
                      trans.translate('admin_access'),
                      textAlign: TextAlign.center,
                      style: AppDesignSystem.titleMedium,
                    ),
                    AppDesignSystem.spacingLG(),
                    CustomTextField(
                      label: 'Email',
                      hint: 'admin@voicetalents.com',
                      keyboardType: TextInputType.emailAddress,
                      onChanged: (val) => _email = val,
                    ),
                    AppDesignSystem.spacingMD(),
                    CustomTextField(
                      label: lang == Language.fr ? 'Mot de passe' : 'Password',
                      hint: '••••••••',
                      obscureText: true,
                      onChanged: (val) => _password = val,
                    ),
                    AppDesignSystem.spacingLG(),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _login,
                      child: _isLoading 
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(trans.translate('btn_login')),
                    ),
                    AppDesignSystem.spacingMD(),
                    TextButton(
                      onPressed: () => context.go('/'),
                      child: Text(
                        trans.translate('btn_return_form'),
                        style: TextStyle(color: AppDesignSystem.primary),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
