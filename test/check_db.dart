import 'dart:convert';
import 'dart:io';

void main() async {
  final client = HttpClient();
  try {
    final uri = Uri.parse('https://oyqlgsrgwfdndvazrijz.supabase.co/rest/v1/applications?select=*&limit=1');
    final request = await client.getUrl(uri);
    request.headers.set('apikey', 'sb_publishable_ubu4zUj613PTz33YHh9_kw_5sUpYJA2');
    request.headers.set('Authorization', 'Bearer sb_publishable_ubu4zUj613PTz33YHh9_kw_5sUpYJA2');
    
    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();
    print('STATUS CODE: ${response.statusCode}');
    print('RESPONSE BODY: $body');
    
    if (response.statusCode == 200) {
      final json = jsonDecode(body) as List;
      if (json.isNotEmpty) {
        final keys = (json.first as Map).keys.toList();
        print('COLUMNS IN APPLICATIONS TABLE: $keys');
      } else {
        print('No records found in applications table.');
      }
    }
  } catch (e) {
    print('ERROR: $e');
  } finally {
    client.close();
    exit(0);
  }
}
