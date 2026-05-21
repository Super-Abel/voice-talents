import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/design_system.dart';
import '../../../../core/localization/translation_provider.dart';

class SuccessScreen extends ConsumerWidget {
  final String? applicationId;
  const SuccessScreen({super.key, this.applicationId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trans = ref.watch(translationProvider);

    return Scaffold(
      backgroundColor: AppDesignSystem.backgroundAlt,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Card(
            margin: const EdgeInsets.all(24),
            shape: RoundedRectangleBorder(
              borderRadius: AppDesignSystem.borderLarge,
            ),
            child: Padding(
              padding: const EdgeInsets.all(40.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppDesignSystem.success.withOpacity(0.08),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_outline_rounded,
                      color: AppDesignSystem.success,
                      size: 80,
                    ),
                  ),
                  AppDesignSystem.spacingLG(),
                  Text(
                    trans.translate('success_congrats'),
                    style: AppDesignSystem.titleLarge,
                    textAlign: TextAlign.center,
                  ),
                  AppDesignSystem.spacingMD(),
                  Text(
                    trans.translate('success_message'),
                    style: AppDesignSystem.bodyMedium.copyWith(
                      color: AppDesignSystem.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (applicationId != null) ...[
                    AppDesignSystem.spacingLG(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppDesignSystem.primary.withOpacity(0.06),
                        borderRadius: AppDesignSystem.borderMedium,
                        border: Border.all(color: AppDesignSystem.primary.withOpacity(0.2)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            trans.translate('success_your_id'),
                            style: AppDesignSystem.labelStyle.copyWith(
                              color: AppDesignSystem.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Flexible(
                                child: Text(
                                  applicationId!,
                                  style: AppDesignSystem.bodyMedium.copyWith(
                                    fontWeight: FontWeight.w800,
                                    color: AppDesignSystem.primary,
                                    fontFamily: 'monospace',
                                    fontSize: 13,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              const SizedBox(width: 8),
                              _CopyButton(text: applicationId!),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            trans.translate('success_keep_id'),
                            style: AppDesignSystem.bodySmall.copyWith(
                              color: AppDesignSystem.textSecondary,
                              fontSize: 11,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ],
                  AppDesignSystem.spacingXL(),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      SizedBox(
                        width: 160,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () => context.go('/'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppDesignSystem.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: AppDesignSystem.borderMedium,
                            ),
                          ),
                          child: Text(
                            trans.translate('btn_home'),
                            style: AppDesignSystem.buttonText.copyWith(fontSize: 14),
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 160,
                        height: 48,
                        child: OutlinedButton(
                          onPressed: () => context.push('/tracking'),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppDesignSystem.primary, width: 2),
                            shape: RoundedRectangleBorder(
                              borderRadius: AppDesignSystem.borderMedium,
                            ),
                          ),
                          child: Text(
                            trans.translate('btn_track'),
                            style: AppDesignSystem.labelStyle.copyWith(
                              color: AppDesignSystem.primary,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CopyButton extends StatefulWidget {
  final String text;
  const _CopyButton({required this.text});

  @override
  State<_CopyButton> createState() => _CopyButtonState();
}

class _CopyButtonState extends State<_CopyButton> {
  bool _copied = false;

  Future<void> _copy() async {
    await Clipboard.setData(ClipboardData(text: widget.text));
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: IconButton(
        key: ValueKey(_copied),
        onPressed: _copy,
        icon: Icon(
          _copied ? Icons.check_rounded : Icons.copy_rounded,
          size: 18,
          color: _copied ? AppDesignSystem.success : AppDesignSystem.primary,
        ),
        tooltip: _copied ? 'Copié !' : 'Copier l\'ID',
        padding: EdgeInsets.zero,
        constraints: const BoxConstraints(),
      ),
    );
  }
}
