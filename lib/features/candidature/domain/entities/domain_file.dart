import 'dart:typed_data';

class DomainFile {
  final String name;
  final int size;
  final Uint8List? bytes; // Used by Web & memory inputs
  final String? path;      // Used by Native platforms (Android, iOS, Desktop)

  const DomainFile({
    required this.name,
    required this.size,
    this.bytes,
    this.path,
  });
}
