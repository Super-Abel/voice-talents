import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  final supabase = SupabaseClient(
    'https://oyqlgsrgwfdndvazrijz.supabase.co',
    'sb_publishable_ubu4zUj613PTz33YHh9_kw_5sUpYJA2',
  );
  try {
    final data = await supabase.from('applications').select().limit(1);
    print('SUCCESS: $data');
    if (data.isNotEmpty) {
      print('Keys: ${data.first.keys.toList()}');
    } else {
      print('No applications found to inspect keys.');
    }
  } catch (e) {
    print('ERROR: $e');
  }
}
