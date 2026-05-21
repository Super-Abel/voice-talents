import 'package:flutter/material.dart';
import '../../../../core/theme/design_system.dart';

/// ═══════════════════════════════════════════════════════════
/// CustomDropdown — Voice Talents Design System
///
/// Bug fixes:
/// • Added isExpanded: true → prevents RenderFlex overflow
/// • Uses DropdownButtonHideUnderline to avoid double borders
/// • Custom icon layout avoids the internal Row overflow
///
/// Features:
/// • Animated focus / error states
/// • Inline animated error message
/// • Consistent visual language with CustomTextField
/// ═══════════════════════════════════════════════════════════
class CustomDropdown extends StatefulWidget {
  final String label;
  final String hint;
  final List<String> items;
  final String? value;
  final ValueChanged<String?> onChanged;
  final String? Function(String?)? validator;
  final String? helperText;

  const CustomDropdown({
    super.key,
    required this.label,
    required this.hint,
    required this.items,
    this.value,
    required this.onChanged,
    this.validator,
    this.helperText,
  });

  @override
  State<CustomDropdown> createState() => _CustomDropdownState();
}

class _CustomDropdownState extends State<CustomDropdown> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;
  bool _hasError = false;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    setState(() => _isFocused = _focusNode.hasFocus);
  }

  String? _validate(String? value) {
    if (widget.validator == null) return null;
    final error = widget.validator!(value);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        setState(() {
          _hasError = error != null;
          _errorText = error;
        });
      }
    });
    return error;
  }

  @override
  Widget build(BuildContext context) {
    final borderColor = _hasError
        ? AppDesignSystem.inputBorderError
        : (_isFocused
              ? AppDesignSystem.inputBorderActive
              : AppDesignSystem.inputBorder);

    final List<BoxShadow> shadows = _hasError
        ? AppDesignSystem.errorShadow
        : (_isFocused ? AppDesignSystem.focusShadow : <BoxShadow>[]);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // ── Label ──────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 7),
          child: Text(
            widget.label.toUpperCase(),
            style: AppDesignSystem.labelStyle.copyWith(
              color: _hasError
                  ? AppDesignSystem.error
                  : (_isFocused
                        ? AppDesignSystem.primary
                        : AppDesignSystem.textSecondary),
            ),
          ),
        ),

        // ── Dropdown Container ────────────────────────────────
        Container(
          decoration: BoxDecoration(
            color: _isFocused ? Colors.white : AppDesignSystem.inputBackground,
            borderRadius: AppDesignSystem.borderMedium,
            border: Border.all(
              color: borderColor,
              width: _isFocused || _hasError ? 1.5 : 1.0,
            ),
            boxShadow: shadows,
          ),
          child: DropdownButtonHideUnderline(
              // ── FIX: FormField wrapper so validation hooks into Form ──
              child: DropdownButtonFormField<String>(
                focusNode: _focusNode,
                // FIX ① isExpanded prevents the internal Row from overflowing
                isExpanded: true,
                value: widget.value,
                decoration: InputDecoration(
                  filled: false,
                  hintText: widget.hint,
                  hintStyle: AppDesignSystem.bodyMedium.copyWith(
                    color: AppDesignSystem.textMuted,
                    fontWeight: FontWeight.w400,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppDesignSystem.spaceMD,
                    vertical: 16,
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  errorBorder: InputBorder.none,
                  focusedErrorBorder: InputBorder.none,
                  errorStyle: const TextStyle(fontSize: 0, height: 0),
                ),
                style: AppDesignSystem.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppDesignSystem.textMain,
                ),
                icon: AnimatedRotation(
                  turns: _isFocused ? 0.5 : 0,
                  duration: AppDesignSystem.animDuration,
                  child: Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: _isFocused
                        ? AppDesignSystem.primary
                        : AppDesignSystem.textMuted,
                    size: 22,
                  ),
                ),
                dropdownColor: Colors.white,
                borderRadius: AppDesignSystem.borderMedium,
                menuMaxHeight: 280,
                items: widget.items.map((e) {
                  return DropdownMenuItem<String>(
                    value: e,
                    child: Text(
                      e,
                      style: AppDesignSystem.bodyMedium.copyWith(
                        fontWeight: FontWeight.w500,
                        color: AppDesignSystem.textMain,
                      ),
                      // FIX ③ Overflow protection inside the menu item
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  widget.onChanged(val);
                  // Clear error on selection
                  if (_hasError && val != null) {
                    setState(() {
                      _hasError = false;
                      _errorText = null;
                    });
                  }
                },
                validator: _validate,
              ),
            ),
          ),

        // ── Error / Helper ────────────────────────────────────
        Container(
          constraints: const BoxConstraints(minHeight: 24),
          padding: const EdgeInsets.only(top: 5, left: 4, bottom: 4),
          child: _hasError && _errorText != null
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 2),
                      child: Icon(Icons.error_outline_rounded, size: 13, color: AppDesignSystem.error),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        _errorText!,
                        style: AppDesignSystem.bodySmall.copyWith(
                          color: AppDesignSystem.error, fontSize: 11, height: 1.2),
                      ),
                    ),
                  ],
                )
              : (widget.helperText != null
                  ? Text(widget.helperText!, style: AppDesignSystem.captionStyle)
                  : const SizedBox.shrink()),
        ),
      ],
    );
  }
}
