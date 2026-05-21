import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/design_system.dart';

/// ═══════════════════════════════════════════════════════════
/// CustomTextField — Voice Talents Design System
///
/// Features:
/// • Accepts an external [controller] OR works standalone
/// • Animated focus ring + glow effect
/// • Inline error display with animated height
/// • Visible character counter when [maxLength] provided
/// • Optional [suffixIcon] / [prefixIcon]
/// • [inputFormatters] for strict input control
/// ═══════════════════════════════════════════════════════════
class CustomTextField extends StatefulWidget {
  final String label;
  final String hint;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final TextInputType keyboardType;
  final bool obscureText;
  final int? maxLines;
  final int? maxLength;
  final TextEditingController? controller;
  final String? initialValue;
  final List<TextInputFormatter>? inputFormatters;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final String? helperText;
  final bool readOnly;
  final bool autofocus;
  final TextInputAction? textInputAction;
  final void Function()? onTap;
  final void Function(String)? onFieldSubmitted;

  const CustomTextField({
    super.key,
    required this.label,
    required this.hint,
    this.validator,
    this.onChanged,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.maxLines = 1,
    this.maxLength,
    this.controller,
    this.initialValue,
    this.inputFormatters,
    this.suffixIcon,
    this.prefixIcon,
    this.helperText,
    this.readOnly = false,
    this.autofocus = false,
    this.textInputAction,
    this.onTap,
    this.onFieldSubmitted,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField>
    with SingleTickerProviderStateMixin {
  final FocusNode _focusNode = FocusNode();
  late final TextEditingController _internalController;
  bool _isFocused = false;
  bool _hasError = false;
  String? _errorText;

  bool get _isUsingExternalController => widget.controller != null;

  TextEditingController get _effectiveController =>
      widget.controller ?? _internalController;

  @override
  void initState() {
    super.initState();
    if (!_isUsingExternalController) {
      _internalController = TextEditingController(text: widget.initialValue);
    }
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(covariant CustomTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Never update the controller while the field has focus — the user is typing
    if (!_isUsingExternalController &&
        !_focusNode.hasFocus &&
        oldWidget.initialValue != widget.initialValue) {
      if (_internalController.text != widget.initialValue) {
        _internalController.text = widget.initialValue ?? '';
      }
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    if (!_isUsingExternalController) {
      _internalController.dispose();
    }
    super.dispose();
  }

  void _onFocusChange() {
    setState(() => _isFocused = _focusNode.hasFocus);
  }

  void _handleChanged(String value) {
    widget.onChanged?.call(value);
    // Live-validate if already shown an error (eager correction feedback)
    if (_hasError && widget.validator != null) {
      final error = widget.validator!(value);
      setState(() {
        _hasError = error != null;
        _errorText = error;
      });
    }
  }

  /// Called by Form.validate() — updates error state after the current frame.
  String? _validate(String? value) {
    if (widget.validator == null) return null;
    final error = widget.validator!(value);
    // Schedule state update after current build to avoid setState-during-build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && (_hasError != (error != null) || _errorText != error)) {
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
        // ── Label ─────────────────────────────────────────────
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

        // ── Input Container ───────────────────────────────────
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
          child: TextFormField(
            controller: _effectiveController,
            focusNode: _focusNode,
            readOnly: widget.readOnly,
            autofocus: widget.autofocus,
            keyboardType: widget.keyboardType,
            obscureText: widget.obscureText,
            maxLines: widget.maxLines,
            maxLength: widget.maxLength,
            textInputAction: widget.textInputAction,
            inputFormatters: widget.inputFormatters,
            onChanged: _handleChanged,
            onTap: widget.onTap,
            onFieldSubmitted: widget.onFieldSubmitted,
            validator: _validate,
            buildCounter: widget.maxLength != null
                ? (context, {required currentLength, required isFocused, maxLength}) {
                    return Text('$currentLength / $maxLength', style: AppDesignSystem.captionStyle);
                  }
                : null,
            style: AppDesignSystem.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: AppDesignSystem.textMain,
            ),
            decoration: InputDecoration(
              filled: false,
              hintText: widget.hint,
              hintStyle: AppDesignSystem.bodyMedium.copyWith(
                color: AppDesignSystem.textMuted,
                fontWeight: FontWeight.w400,
              ),
              contentPadding: EdgeInsets.symmetric(
                horizontal: AppDesignSystem.spaceMD,
                vertical: widget.maxLines != null && widget.maxLines! > 1 ? 14 : 16,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              errorStyle: const TextStyle(fontSize: 0, height: 0),
              prefixIcon: widget.prefixIcon,
              suffixIcon: widget.suffixIcon,
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
                          color: AppDesignSystem.error,
                          fontSize: 11,
                          height: 1.2,
                        ),
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
