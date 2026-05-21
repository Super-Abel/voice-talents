import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ═══════════════════════════════════════════════════════════
/// VOICE TALENTS — AppDesignSystem
/// Single source of truth for all visual tokens.
/// Version: 3.0 (Professional UI/UX rebuild)
/// ═══════════════════════════════════════════════════════════
class AppDesignSystem {
  AppDesignSystem._(); // prevent instantiation

  // ─────────────────────────────────────────
  // 1. BRAND PALETTE
  // ─────────────────────────────────────────

  /// Core purple (brand primary)
  static const Color primary = Color(0xFF724695);

  /// Lighter purple for highlights, hover states
  static const Color primaryLight = Color(0xFF9168B5);

  /// Deeper purple for active/pressed states
  static const Color primaryDark = Color(0xFF5A3776);

  /// Official yellow accent (CTA, progress, highlights)
  static const Color accentYellow = Color(0xFFF5AE16);

  /// Light yellow tint for backgrounds / chips
  static const Color accentYellowLight = Color(0xFFFFF6DC);

  // ─────────────────────────────────────────
  // 2. SEMANTIC COLORS
  // ─────────────────────────────────────────

  static const Color success = Color(0xFF2ECC71);
  static const Color successLight = Color(0xFFE8F9F1);
  static const Color warning = Color(0xFFF5AE16);
  static const Color warningLight = Color(0xFFFFF6DC);
  static const Color error = Color(0xFFE74C3C);
  static const Color errorLight = Color(0xFFFDECEB);
  static const Color info = Color(0xFF2E86DE);
  static const Color infoLight = Color(0xFFE8F1FD);

  // ─────────────────────────────────────────
  // 3. SURFACE / BACKGROUND COLORS
  // ─────────────────────────────────────────

  static const Color background = Color(0xFFFFFFFF);
  static const Color backgroundAlt = Color(0xFFFDF9F2);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color surfaceElevated = Color(0xFFF8F5FD);

  // ─────────────────────────────────────────
  // 4. INPUT / FORM TOKENS
  // ─────────────────────────────────────────

  static const Color inputBackground = Color(0xFFF8F8FA);
  static const Color inputBorder = Color(0xFFEAEAF0);
  static const Color inputBorderActive = Color(0xFF724695);
  static const Color inputBorderError = Color(0xFFE74C3C);
  static const Color focusGlow = Color(0x2A724695);
  static const Color errorGlow = Color(0x1AE74C3C);

  // ─────────────────────────────────────────
  // 5. TEXT COLORS
  // ─────────────────────────────────────────

  static const Color textMain = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF555570);
  static const Color textMuted = Color(0xFFA0A0B8);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textOnAccent = Color(0xFF1A1A2E);

  // ─────────────────────────────────────────
  // 6. BRAND PARTNER COLORS
  // ─────────────────────────────────────────

  static const Color japapBlue = Color(0xFF1E88E5);
  static const Color japapRed = Color(0xFFE53935);

  // ─────────────────────────────────────────
  // 7. GRADIENTS
  // ─────────────────────────────────────────

  static const Gradient primaryGradient = LinearGradient(
    colors: [Color(0xFF724695), Color(0xFF9168B5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient accentGradient = LinearGradient(
    colors: [Color(0xFFF5AE16), Color(0xFFFFCC55)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient backgroundGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFF3EDFD)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const Gradient successGradient = LinearGradient(
    colors: [Color(0xFF2ECC71), Color(0xFF27AE60)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ─────────────────────────────────────────
  // 8. SHADOWS
  // ─────────────────────────────────────────

  static List<BoxShadow> get shadowSm => [
        BoxShadow(
          color: Colors.black.withOpacity(0.05),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get shadowMd => [
        BoxShadow(
          color: Colors.black.withOpacity(0.08),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get shadowLg => [
        BoxShadow(
          color: Colors.black.withOpacity(0.12),
          blurRadius: 32,
          offset: const Offset(0, 12),
        ),
      ];

  static List<BoxShadow> get primaryShadow => [
        BoxShadow(
          color: primary.withOpacity(0.25),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
      ];

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: primary.withOpacity(0.06),
          blurRadius: 32,
          offset: const Offset(0, 12),
        ),
        BoxShadow(
          color: Colors.black.withOpacity(0.03),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get focusShadow => [
        BoxShadow(
          color: focusGlow,
          blurRadius: 12,
          spreadRadius: 2,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get errorShadow => [
        BoxShadow(
          color: errorGlow,
          blurRadius: 12,
          spreadRadius: 2,
          offset: const Offset(0, 2),
        ),
      ];

  // Kept for backward compat
  static List<BoxShadow> get premiumShadow => shadowMd;

  // ─────────────────────────────────────────
  // 9. SPACING
  // ─────────────────────────────────────────

  static const double spaceXXS = 2.0;
  static const double spaceXS = 4.0;
  static const double spaceSM = 8.0;
  static const double spaceMD = 16.0;
  static const double spaceLG = 24.0;
  static const double spaceXL = 32.0;
  static const double spaceXXL = 48.0;
  static const double space3XL = 64.0;

  // Directional spacing widgets
  static Widget hXS() => const SizedBox(width: spaceXS);
  static Widget hSM() => const SizedBox(width: spaceSM);
  static Widget hMD() => const SizedBox(width: spaceMD);
  static Widget hLG() => const SizedBox(width: spaceLG);

  static Widget vXS() => const SizedBox(height: spaceXS);
  static Widget vSM() => const SizedBox(height: spaceSM);
  static Widget vMD() => const SizedBox(height: spaceMD);
  static Widget vLG() => const SizedBox(height: spaceLG);
  static Widget vXL() => const SizedBox(height: spaceXL);

  // Legacy square spacers (backward compat)
  static Widget spacingXS() => const SizedBox(width: spaceXS, height: spaceXS);
  static Widget spacingSM() => const SizedBox(width: spaceSM, height: spaceSM);
  static Widget spacingMD() => const SizedBox(width: spaceMD, height: spaceMD);
  static Widget spacingLG() => const SizedBox(width: spaceLG, height: spaceLG);
  static Widget spacingXL() => const SizedBox(width: spaceXL, height: spaceXL);
  static Widget spacingXXL() => const SizedBox(width: spaceXXL, height: spaceXXL);

  // ─────────────────────────────────────────
  // 10. BORDER RADIUS
  // ─────────────────────────────────────────

  static const double radiusXS = 4.0;
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  static const double radiusXL = 20.0;
  static const double radiusExtraLarge = 24.0;
  static const double radiusFull = 100.0;

  static BorderRadius get borderXS => BorderRadius.circular(radiusXS);
  static BorderRadius get borderSmall => BorderRadius.circular(radiusSmall);
  static BorderRadius get borderMedium => BorderRadius.circular(radiusMedium);
  static BorderRadius get borderLarge => BorderRadius.circular(radiusLarge);
  static BorderRadius get borderXL => BorderRadius.circular(radiusXL);
  static BorderRadius get borderExtraLarge => BorderRadius.circular(radiusExtraLarge);
  static BorderRadius get borderFull => BorderRadius.circular(radiusFull);

  // ─────────────────────────────────────────
  // 11. ANIMATION TOKENS
  // ─────────────────────────────────────────

  static const Duration animFast = Duration(milliseconds: 120);
  static const Duration animDuration = Duration(milliseconds: 200);
  static const Duration animSlow = Duration(milliseconds: 350);
  static const Duration animXSlow = Duration(milliseconds: 600);
  static const Curve animCurve = Curves.easeInOut;
  static const Curve animSpring = Curves.elasticOut;

  // ─────────────────────────────────────────
  // 12. TYPOGRAPHY
  // ─────────────────────────────────────────

  // Display
  static TextStyle get displayLarge => GoogleFonts.outfit(
        fontSize: 40,
        fontWeight: FontWeight.w900,
        color: textMain,
        letterSpacing: -1.0,
        height: 1.1,
      );

  static TextStyle get displayMedium => GoogleFonts.outfit(
        fontSize: 32,
        fontWeight: FontWeight.w800,
        color: textMain,
        letterSpacing: -0.5,
        height: 1.2,
      );

  // Headings
  static TextStyle get titleLarge => GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        color: textMain,
        letterSpacing: -0.3,
        height: 1.2,
      );

  static TextStyle get titleMedium => GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: textMain,
        height: 1.25,
      );

  static TextStyle get titleSmall => GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textMain,
        height: 1.3,
      );

  // Body
  static TextStyle get bodyLarge => GoogleFonts.montserrat(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: textMain,
        height: 1.6,
      );

  static TextStyle get bodyMedium => GoogleFonts.montserrat(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: textMain,
        height: 1.5,
      );

  static TextStyle get bodySmall => GoogleFonts.montserrat(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: textSecondary,
        height: 1.4,
      );

  // UI elements
  static TextStyle get labelStyle => GoogleFonts.outfit(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: textSecondary,
        letterSpacing: 1.0,
      );

  static TextStyle get captionStyle => GoogleFonts.montserrat(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: textMuted,
        letterSpacing: 0.3,
      );

  static TextStyle get buttonText => GoogleFonts.outfit(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: textOnPrimary,
        letterSpacing: 0.8,
      );

  static TextStyle get chipText => GoogleFonts.outfit(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
      );

  // ─────────────────────────────────────────
  // 13. RESPONSIVE HELPERS
  // ─────────────────────────────────────────

  /// Returns true if the screen is considered mobile (< 600px)
  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < 600;

  /// Returns true if the screen is tablet (600–1024px)
  static bool isTablet(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    return w >= 600 && w < 1024;
  }

  /// Returns true if the screen is desktop (>= 1024px)
  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= 1024;

  /// Returns adaptive horizontal padding based on screen size
  static double horizontalPadding(BuildContext context) {
    if (isMobile(context)) return spaceMD;
    if (isTablet(context)) return spaceLG;
    return spaceXL;
  }

  // ─────────────────────────────────────────
  // 14. COMMON DECORATIONS
  // ─────────────────────────────────────────

  /// Card decoration with subtle shadow
  static BoxDecoration get cardDecoration => BoxDecoration(
        color: cardBackground,
        borderRadius: borderMedium,
        boxShadow: cardShadow,
      );

  /// Chip / badge decoration
  static BoxDecoration chipDecoration(Color color) => BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: borderFull,
        border: Border.all(color: color.withOpacity(0.2)),
      );

  // ─────────────────────────────────────────
  // 15. SEMANTIC SOUNDWAVE TOKEN
  // ─────────────────────────────────────────
  static const Color soundwaveWave = Color(0xFF9168B5);
}
