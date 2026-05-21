import 'dart:math';
import 'dart:io' as io;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:universal_html/html.dart' as html;
import 'dart:ui_web' as ui_web;
import '../../../../core/theme/design_system.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../domain/entities/domain_file.dart';

class FileUploadWidget extends ConsumerStatefulWidget {
  final String label;
  final String? currentFile;
  final DomainFile? file;
  final VoidCallback onPick;
  final VoidCallback? onClear;
  final String? errorText;

  const FileUploadWidget({
    super.key,
    required this.label,
    required this.currentFile,
    this.file,
    required this.onPick,
    this.onClear,
    this.errorText,
  });

  @override
  ConsumerState<FileUploadWidget> createState() => _FileUploadWidgetState();
}

class _FileUploadWidgetState extends ConsumerState<FileUploadWidget> with SingleTickerProviderStateMixin {
  bool _isHovered = false;

  Widget _buildImagePreview(DomainFile file, {bool fullscreen = false}) {
    if (kIsWeb) {
      if (file.bytes != null) {
        return Image.memory(
          file.bytes!,
          fit: fullscreen ? BoxFit.contain : BoxFit.cover,
        );
      }
    } else {
      if (file.path != null) {
        return Image.file(
          io.File(file.path!),
          fit: fullscreen ? BoxFit.contain : BoxFit.cover,
        );
      }
    }
    return const Center(
      child: Icon(Icons.image_not_supported_rounded, color: Colors.grey),
    );
  }

  Widget _buildVideoPreview(DomainFile file, {String suffix = ''}) {
    if (kIsWeb) {
      final viewId = 'video-preview-${file.name.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '')}$suffix';

      ui_web.platformViewRegistry.registerViewFactory(
        viewId,
        (int id) {
          final video = html.VideoElement()
            ..controls = true
            ..autoplay = false
            ..style.width = '100%'
            ..style.height = '100%'
            ..style.borderRadius = '12px'
            ..style.border = 'none';

          if (file.bytes != null) {
            final blob = html.Blob([file.bytes]);
            video.src = html.Url.createObjectUrlFromBlob(blob);
          }
          return video;
        },
      );

      return HtmlElementView(viewType: viewId);
    } else {
      final t = ref.read(translationProvider);
      return Container(
        color: Colors.black87,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.video_library_rounded, color: Colors.white, size: 48),
              const SizedBox(height: 8),
              Text(
                t.translate(AppKeys.uploadPreviewWebOnly),
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }
  }

  void _openPreviewDialog(BuildContext context, bool isVideo) {
    if (widget.file == null) return;
    showDialog(
      context: context,
      barrierColor: Colors.black87,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(ctx).size.width,
                maxHeight: MediaQuery.of(ctx).size.height * 0.85,
              ),
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(16),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: isVideo
                    ? _buildVideoPreview(widget.file!, suffix: '-fullscreen')
                    : _buildImagePreview(widget.file!, fullscreen: true),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: Material(
                color: Colors.black54,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: () => Navigator.of(ctx).pop(),
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.close_rounded, color: Colors.white, size: 22),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    widget.currentFile ?? '',
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(translationProvider);
    final hasFile = widget.currentFile != null;
    final isVideo = widget.label.toLowerCase().contains('vidéo') ||
        widget.label.toLowerCase().contains('video');
    final isAudio = (widget.label.toLowerCase().contains('voix') ||
        widget.label.toLowerCase().contains('chant')) && !isVideo;
    final isAudioOrVideo = isVideo || isAudio;
    final sizeKey = isVideo || isAudio ? AppKeys.uploadMaxSizeVideo : AppKeys.uploadMaxSizePhoto;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            widget.label.toUpperCase(),
            style: AppDesignSystem.labelStyle.copyWith(
              color: hasFile ? AppDesignSystem.success : AppDesignSystem.textSecondary.withOpacity(0.8),
              fontSize: 11,
              letterSpacing: 1.2,
            ),
          ),
        ),
        MouseRegion(
          onEnter: (_) { if (mounted) setState(() => _isHovered = true); },
          onExit: (_) { if (mounted) setState(() => _isHovered = false); },
          child: GestureDetector(
            onTap: widget.onPick,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: widget.errorText != null && !hasFile
                    ? AppDesignSystem.error.withValues(alpha: 0.02)
                    : hasFile
                        ? AppDesignSystem.success.withValues(alpha: 0.02)
                        : (_isHovered ? const Color(0xFFF3EDFD) : AppDesignSystem.inputBackground),
                borderRadius: AppDesignSystem.borderLarge,
                border: Border.all(
                  color: widget.errorText != null && !hasFile
                      ? AppDesignSystem.error.withValues(alpha: 0.6)
                      : hasFile
                          ? AppDesignSystem.success.withValues(alpha: 0.6)
                          : (_isHovered ? AppDesignSystem.primary : AppDesignSystem.inputBorder),
                  width: widget.errorText != null || _isHovered || hasFile ? 1.5 : 1.0,
                ),
                boxShadow: _isHovered
                    ? [
                        BoxShadow(
                          color: AppDesignSystem.primary.withOpacity(0.08),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ]
                    : [],
              ),
              child: hasFile
                  ? Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isAudioOrVideo
                                    ? AppDesignSystem.primary.withOpacity(0.1)
                                    : AppDesignSystem.success.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isVideo
                                    ? Icons.videocam_rounded
                                    : isAudio
                                        ? Icons.audiotrack_rounded
                                        : Icons.image_rounded,
                                color: isAudioOrVideo ? AppDesignSystem.primary : AppDesignSystem.success,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.currentFile!,
                                    style: AppDesignSystem.bodyMedium.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: AppDesignSystem.textMain,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    isVideo
                                        ? t.translate(AppKeys.uploadVideoLoaded)
                                        : isAudio
                                            ? t.translate(AppKeys.uploadAudioLoaded)
                                            : t.translate(AppKeys.uploadPhotoLoaded),
                                    style: AppDesignSystem.bodySmall.copyWith(
                                      color: AppDesignSystem.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (widget.file != null && (isVideo || !isAudio))
                              IconButton(
                                onPressed: () => _openPreviewDialog(context, isVideo),
                                icon: Icon(
                                  isVideo ? Icons.play_circle_outline_rounded : Icons.zoom_in_rounded,
                                  color: AppDesignSystem.primary,
                                ),
                                tooltip: isVideo
                                    ? t.translate(AppKeys.uploadTooltipPlay)
                                    : t.translate(AppKeys.uploadTooltipView),
                              ),
                            if (widget.onClear != null)
                              IconButton(
                                onPressed: () => widget.onClear!(),
                                icon: const Icon(
                                  Icons.delete_outline_rounded,
                                  color: AppDesignSystem.error,
                                ),
                                tooltip: t.translate(AppKeys.uploadTooltipDelete),
                              )
                            else
                              const Icon(
                                Icons.check_circle_rounded,
                                color: AppDesignSystem.success,
                                size: 24,
                              ),
                          ],
                        ),
                        // Miniature inline — image
                        if (widget.file != null && !isAudioOrVideo) ...[
                          const SizedBox(height: 16),
                          GestureDetector(
                            onTap: () => _openPreviewDialog(context, false),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  height: 220,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: AppDesignSystem.borderMedium,
                                    border: Border.all(color: Colors.grey.shade200),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: AppDesignSystem.borderMedium,
                                    child: _buildImagePreview(widget.file!),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.black45,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.zoom_in_rounded, color: Colors.white, size: 16),
                                      const SizedBox(width: 4),
                                      Text(
                                        t.translate(AppKeys.uploadActionEnlarge),
                                        style: const TextStyle(color: Colors.white, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        // Miniature inline — vidéo (sans soundwave)
                        if (widget.file != null && isVideo) ...[
                          const SizedBox(height: 16),
                          GestureDetector(
                            onTap: () => _openPreviewDialog(context, true),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  height: 160,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: Colors.black,
                                    borderRadius: AppDesignSystem.borderMedium,
                                    border: Border.all(color: Colors.grey.shade200),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: AppDesignSystem.borderMedium,
                                    child: _buildVideoPreview(widget.file!),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.black45,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.fullscreen_rounded, color: Colors.white, size: 16),
                                      const SizedBox(width: 4),
                                      Text(
                                        t.translate(AppKeys.uploadActionFullscreen),
                                        style: const TextStyle(color: Colors.white, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        // Soundwave animée — audio uniquement
                        if (isAudio) ...[
                          const SizedBox(height: 20),
                          const PulsingSoundwave(),
                        ],
                      ],
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Icon(
                            isVideo
                                ? Icons.videocam_outlined
                                : isAudio
                                    ? Icons.mic_external_on_rounded
                                    : Icons.cloud_upload_outlined,
                            color: AppDesignSystem.primary,
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          isVideo
                              ? t.translate(AppKeys.uploadVideoPrompt)
                              : isAudio
                                  ? t.translate(AppKeys.uploadAudioPrompt)
                                  : t.translate(AppKeys.uploadPhotoPrompt),
                          style: AppDesignSystem.bodyMedium.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppDesignSystem.textMain,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          t.translate(AppKeys.uploadClickHint),
                          style: AppDesignSystem.bodySmall.copyWith(
                            color: AppDesignSystem.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppDesignSystem.primary.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            t.translate(sizeKey),
                            style: AppDesignSystem.bodySmall.copyWith(
                              color: AppDesignSystem.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
        // Erreur inline (taille, extension, fichier requis)
        if (widget.errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Icon(Icons.error_outline_rounded, size: 13, color: AppDesignSystem.error),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    widget.errorText!,
                    style: AppDesignSystem.bodySmall.copyWith(
                      color: AppDesignSystem.error, fontSize: 11, height: 1.2),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class PulsingSoundwave extends StatefulWidget {
  const PulsingSoundwave({super.key});

  @override
  State<PulsingSoundwave> createState() => _PulsingSoundwaveState();
}

class _PulsingSoundwaveState extends State<PulsingSoundwave> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(32, (index) {
            final baseHeight = 8.0 + (index % 5) * 6.0 + _random.nextDouble() * 10.0;
            final height = (baseHeight * (0.3 + 0.7 * sin(_controller.value * pi + index * 0.4))).clamp(2.0, double.infinity);
            return Container(
              width: 3,
              height: height,
              margin: const EdgeInsets.symmetric(horizontal: 2.0),
              decoration: BoxDecoration(
                color: AppDesignSystem.soundwaveWave,
                borderRadius: BorderRadius.circular(2),
              ),
            );
          }),
        );
      },
    );
  }
}
