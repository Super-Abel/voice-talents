import 'package:flutter/material.dart';
import '../theme/design_system.dart';

Future<void> showErrorDialog(
  BuildContext context, {
  required String message,
  String? title,
  VoidCallback? onRetry,
  String retryLabel = 'Réessayer',
  String cancelLabel = 'Fermer',
}) {
  return showDialog(
    context: context,
    builder: (_) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: AppDesignSystem.borderLarge),
      title: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: AppDesignSystem.error, size: 24),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title ?? 'Erreur',
              style: AppDesignSystem.titleSmall.copyWith(color: AppDesignSystem.error),
            ),
          ),
        ],
      ),
      content: Text(message, style: AppDesignSystem.bodyMedium),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(cancelLabel,
              style: TextStyle(color: AppDesignSystem.textSecondary)),
        ),
        if (onRetry != null)
          ElevatedButton(
            onPressed: () { Navigator.pop(context); onRetry(); },
            style: ElevatedButton.styleFrom(backgroundColor: AppDesignSystem.primary),
            child: Text(retryLabel),
          ),
      ],
    ),
  );
}
