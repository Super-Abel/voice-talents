import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  final supabase = SupabaseClient(
    'https://oyqlgsrgwfdndvazrijz.supabase.co',
    'sb_publishable_ubu4zUj613PTz33YHh9_kw_5sUpYJA2',
  );
  try {
    print('Querying campaigns...');
    final campaigns = await supabase.from('campaigns').select('id, title, is_active').limit(5);
    print('Campaigns: $campaigns');

    print('Querying applications...');
    final apps = await supabase.from('applications').select('id, nom_prenom').limit(5);
    print('Applications: $apps');
  } catch (e) {
    print('ERROR: $e');
  } finally {
    print('Exiting...');
    exit(0);
  }
}
