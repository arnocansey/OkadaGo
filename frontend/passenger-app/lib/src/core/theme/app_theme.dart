import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  static const Color forest = Color(0xFF0D6B4A);
  static const Color orange = Color(0xFFFFB800);
  static const Color amber = Color(0xFFFFB800);
  static const Color slate = Color(0xFF0F172A);
  static const Color body = Color(0xFF475569);
  static const Color shell = Color(0xFFF9FAFB);
  static const Color border = Color(0xFFE5E7EB);

  static ThemeData light() {
    final textTheme = GoogleFonts.interTextTheme().copyWith(
      displayLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w800,
        color: slate,
      ),
      displayMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w800,
        color: slate,
      ),
      headlineLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w800,
        color: slate,
      ),
      headlineMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w800,
        color: slate,
      ),
      titleLarge: GoogleFonts.inter(fontWeight: FontWeight.w700, color: slate),
      titleMedium: GoogleFonts.inter(fontWeight: FontWeight.w700, color: slate),
      bodyLarge: GoogleFonts.inter(color: body),
      bodyMedium: GoogleFonts.inter(color: body),
    );

    final colorScheme =
        ColorScheme.fromSeed(
          seedColor: forest,
          primary: forest,
          secondary: orange,
          surface: Colors.white,
          brightness: Brightness.light,
        ).copyWith(
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          outline: border,
        );

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: shell,
      colorScheme: colorScheme,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        foregroundColor: slate,
        titleTextStyle: textTheme.titleLarge,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 18,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: forest, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: forest,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: slate,
          minimumSize: const Size.fromHeight(56),
          side: const BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        margin: EdgeInsets.zero,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: border),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: forest.withValues(alpha: 0.12),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => GoogleFonts.inter(
            color: states.contains(WidgetState.selected) ? slate : body,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.white,
        selectedColor: forest.withValues(alpha: 0.12),
        side: const BorderSide(color: border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          color: slate,
        ),
      ),
    );
  }
}
