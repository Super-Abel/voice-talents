import 'package:flutter/material.dart';
import 'design_system.dart';

/// Application theme built entirely on AppDesignSystem tokens.
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppDesignSystem.primary,
        primary: AppDesignSystem.primary,
        secondary: AppDesignSystem.primaryLight,
        error: AppDesignSystem.error,
        surface: AppDesignSystem.cardBackground,
        onPrimary: AppDesignSystem.textOnPrimary,
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: AppDesignSystem.background,

      // ── Typography ─────────────────────────────────────────
      textTheme: const TextTheme().apply(
        fontFamily: 'Montserrat',
        fontFamilyFallback: const ['sans-serif'],
        bodyColor: AppDesignSystem.textMain,
        displayColor: AppDesignSystem.textMain,
      ),

      // ── InputDecoration ────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppDesignSystem.inputBackground,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: AppDesignSystem.borderMedium,
          borderSide: const BorderSide(color: AppDesignSystem.inputBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppDesignSystem.borderMedium,
          borderSide: const BorderSide(color: AppDesignSystem.inputBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppDesignSystem.borderMedium,
          borderSide: const BorderSide(color: AppDesignSystem.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppDesignSystem.borderMedium,
          borderSide: const BorderSide(color: AppDesignSystem.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppDesignSystem.borderMedium,
          borderSide: const BorderSide(color: AppDesignSystem.error, width: 2),
        ),
        hintStyle: AppDesignSystem.bodyMedium.copyWith(
          color: AppDesignSystem.textMuted,
        ),
        labelStyle: AppDesignSystem.labelStyle,
        errorStyle: AppDesignSystem.bodySmall.copyWith(
          color: AppDesignSystem.error,
          fontSize: 11,
        ),
      ),

      // ── ElevatedButton ─────────────────────────────────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppDesignSystem.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: AppDesignSystem.borderMedium,
          ),
          elevation: 0,
          textStyle: AppDesignSystem.buttonText,
        ),
      ),

      // ── TextButton ──────────────────────────────────────────
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppDesignSystem.primary,
          textStyle: AppDesignSystem.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── Card ────────────────────────────────────────────────
      cardTheme: CardThemeData(
        color: AppDesignSystem.cardBackground,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppDesignSystem.borderMedium,
          side: const BorderSide(color: AppDesignSystem.inputBorder),
        ),
        margin: EdgeInsets.zero,
      ),

      // ── Checkbox ────────────────────────────────────────────
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppDesignSystem.primary;
          }
          return Colors.transparent;
        }),
        checkColor: WidgetStateProperty.all(Colors.white),
        side: const BorderSide(color: AppDesignSystem.inputBorder, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
      ),

      // ── ProgressIndicator ───────────────────────────────────
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppDesignSystem.primary,
        linearTrackColor: AppDesignSystem.inputBorder,
      ),

      // ── Divider ─────────────────────────────────────────────
      dividerTheme: const DividerThemeData(
        color: AppDesignSystem.inputBorder,
        thickness: 1,
        space: 1,
      ),

      // ── SnackBar ────────────────────────────────────────────
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppDesignSystem.textMain,
        contentTextStyle: AppDesignSystem.bodyMedium.copyWith(
          color: Colors.white,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: AppDesignSystem.borderSmall,
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
