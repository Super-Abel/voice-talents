import 'package:flutter/material.dart';
import '../../../../core/theme/design_system.dart';

const _camerounQuartiers = <String>[
  'Douala — Akwa', 'Douala — Bonanjo', 'Douala — Bali', 'Douala — Deido',
  'Douala — Bonabéri', 'Douala — Makepe', 'Douala — Logbessou', 'Douala — Kotto',
  'Douala — Ndokotti', 'Douala — Ndog-Bong', 'Douala — PK8', 'Douala — PK14',
  'Douala — Bonamoussadi', 'Douala — Bassa', 'Douala — New-Bell',
  'Douala — Village', 'Douala — Bonapriso', 'Douala — Mboppi',
  'Yaoundé — Bastos', 'Yaoundé — Centre-ville', 'Yaoundé — Mvan', 'Yaoundé — Mvog-Mbi',
  'Yaoundé — Nkolbisson', 'Yaoundé — Ngousso', 'Yaoundé — Biyem-Assi', 'Yaoundé — Melen',
  'Yaoundé — Ekounou', 'Yaoundé — Essos', 'Yaoundé — Nsam', 'Yaoundé — Omnisports',
  'Yaoundé — Nlongkak', 'Yaoundé — Elig-Edzoa', 'Yaoundé — Mendong', 'Yaoundé — Simbock',
  'Yaoundé — Tsinga', 'Yaoundé — Madagascar', 'Yaoundé — Etoa-Meki',
  'Bafoussam — Centre', 'Bafoussam — Kamkop', 'Bafoussam — Djeleng', 'Bafoussam — Tamdja',
  'Bamenda — Commercial Avenue', 'Bamenda — Nkwen', 'Bamenda — Up Station', 'Bamenda — Old Town',
  'Garoua — Centre', 'Garoua — Lopéré', 'Garoua — Roumdé Adjia',
  'Ngaoundéré — Centre', 'Ngaoundéré — Burkina', 'Ngaoundéré — Joli-Soir',
  'Maroua — Centre', 'Maroua — Palar', 'Maroua — Doualaré',
  'Kribi — Centre', 'Limbe — Down Beach', 'Limbe — Bota',
  'Buea — Molyko', 'Buea — Bonduma', 'Ebolowa — Centre', 'Bertoua — Centre',
];

class CityQuartierField extends StatefulWidget {
  final String label;
  final String hint;
  final String? initialValue;
  final String? Function(String?)? validator;
  final void Function(String) onChanged;

  const CityQuartierField({
    super.key,
    required this.label,
    required this.hint,
    required this.onChanged,
    this.initialValue,
    this.validator,
  });

  @override
  State<CityQuartierField> createState() => _CityQuartierFieldState();
}

class _CityQuartierFieldState extends State<CityQuartierField> {
  late final TextEditingController _controller;
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;
  bool _hasError = false;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue ?? '');
    _focusNode.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    if (mounted) setState(() => _isFocused = _focusNode.hasFocus);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  String? _validate(String? value) {
    if (widget.validator == null) return null;
    final error = widget.validator!(value);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && (_hasError != (error != null) || _errorText != error)) {
        setState(() { _hasError = error != null; _errorText = error; });
      }
    });
    return error;
  }

  @override
  Widget build(BuildContext context) {
    final borderColor = _hasError
        ? AppDesignSystem.inputBorderError
        : (_isFocused ? AppDesignSystem.inputBorderActive : AppDesignSystem.inputBorder);

    return FormField<String>(
      initialValue: widget.initialValue ?? '',
      validator: _validate,
      builder: (field) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 2, bottom: 7),
            child: Text(
              widget.label.toUpperCase(),
              style: AppDesignSystem.labelStyle.copyWith(
                color: _hasError ? AppDesignSystem.error
                    : (_isFocused ? AppDesignSystem.primary : AppDesignSystem.textSecondary),
              ),
            ),
          ),
          Autocomplete<String>(
            initialValue: TextEditingValue(text: widget.initialValue ?? ''),
            optionsBuilder: (TextEditingValue value) {
              if (value.text.trim().length < 2) return const [];
              final q = value.text.toLowerCase().trim();
              return _camerounQuartiers
                  .where((e) => e.toLowerCase().contains(q))
                  .take(8);
            },
            onSelected: (value) {
              field.didChange(value);
              widget.onChanged(value);
              if (mounted) setState(() { _hasError = false; _errorText = null; });
            },
            fieldViewBuilder: (context, controller, focusNode, onSubmitted) {
              // Sync external controller state
              if (_controller.text != controller.text) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) _controller.text = controller.text;
                });
              }
              return Container(
                decoration: BoxDecoration(
                  color: _isFocused ? Colors.white : AppDesignSystem.inputBackground,
                  borderRadius: AppDesignSystem.borderMedium,
                  border: Border.all(color: borderColor, width: _isFocused || _hasError ? 1.5 : 1.0),
                  boxShadow: _isFocused ? AppDesignSystem.focusShadow
                      : (_hasError ? AppDesignSystem.errorShadow : []),
                ),
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  style: AppDesignSystem.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppDesignSystem.textMain,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hint,
                    hintStyle: AppDesignSystem.bodyMedium.copyWith(
                      color: AppDesignSystem.textMuted,
                      fontWeight: FontWeight.w400,
                    ),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: AppDesignSystem.spaceMD, vertical: 16),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    suffixIcon: controller.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close, size: 16, color: AppDesignSystem.textSecondary),
                            onPressed: () {
                              controller.clear();
                              field.didChange('');
                              widget.onChanged('');
                            },
                          )
                        : const Icon(Icons.location_on_outlined, size: 18, color: AppDesignSystem.textSecondary),
                  ),
                  onChanged: (v) {
                    field.didChange(v);
                    widget.onChanged(v);
                    if (_hasError && widget.validator != null) {
                      final err = widget.validator!(v);
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted) setState(() { _hasError = err != null; _errorText = err; });
                      });
                    }
                  },
                ),
              );
            },
            optionsViewBuilder: (context, onSelected, options) {
              return Align(
                alignment: Alignment.topLeft,
                child: Material(
                  elevation: 8,
                  shadowColor: Colors.black12,
                  borderRadius: AppDesignSystem.borderMedium,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 400, maxHeight: 280),
                    child: ClipRRect(
                      borderRadius: AppDesignSystem.borderMedium,
                      child: ListView.builder(
                        padding: EdgeInsets.zero,
                        shrinkWrap: true,
                        itemCount: options.length,
                        itemBuilder: (context, index) {
                          final option = options.elementAt(index);
                          return ListTile(
                            dense: true,
                            leading: const Icon(Icons.location_on_outlined, size: 16, color: AppDesignSystem.primary),
                            title: Text(option, style: AppDesignSystem.bodySmall.copyWith(color: AppDesignSystem.textMain)),
                            onTap: () => onSelected(option),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
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
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}
