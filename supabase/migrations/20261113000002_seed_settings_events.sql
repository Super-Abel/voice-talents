insert into settings (key, value) values
  ('registration_opens_at',   '"2026-11-21T00:00:00+01:00"'),
  ('registration_closes_at',  '"2026-11-27T23:59:59+01:00"'),
  ('casting_date',            '"2026-11-28"'),
  ('age_min',                 '18'),
  ('age_max',                 '35'),
  ('vote_price_xaf',          '100'),
  ('vote_packs',              '[5, 10, 50, 100]'),
  ('vote_max_quantity',       '1000'),
  ('results_display',         '"hidden"'),
  ('qualification_rule',      '"overall"'),
  ('first_round_qualified',   '24'),
  ('finalists',               '6'),
  ('ticket_max_per_order',    '10'),
  ('ticket_hold_minutes',     '15'),
  ('payment_expiry_minutes',  '30'),
  ('payment_provider',        '"notchpay"'),
  ('payment_sandbox',         'true'),
  ('sms_enabled',             'false'),
  ('prize',                   '{"amount_xaf": 500000, "other": "Autres lots offerts par les partenaires"}'),
  ('contact',                 '{"email": "", "phone": "", "whatsapp": "", "address": "Douala, Cameroun"}'),
  ('sponsors',                '[]'),
  ('site_texts',              '{}');

-- Dates indicatives (19h00 heure de Douala), lieux et capacités à compléter dans le back-office.
with ev (slug, name, phase, round_no, starts_at) as (values
  ('premiere-phase-1', 'Première phase – Émission 1', 'first_round'::event_phase, 1, timestamptz '2026-12-12 19:00:00+01'),
  ('premiere-phase-2', 'Première phase – Émission 2', 'first_round', 2, '2026-12-19 19:00:00+01'),
  ('premiere-phase-3', 'Première phase – Émission 3', 'first_round', 3, '2026-12-26 19:00:00+01'),
  ('premiere-phase-4', 'Première phase – Émission 4', 'first_round', 4, '2026-12-27 19:00:00+01'),
  ('battles-1',        'Battles – Émission 1',        'battle',      1, '2027-01-03 19:00:00+01'),
  ('battles-2',        'Battles – Émission 2',        'battle',      2, '2027-01-09 19:00:00+01'),
  ('demi-finale',      'Demi-finale',                 'semi_final',  1, '2027-01-17 19:00:00+01'),
  ('grande-finale',    'Grande finale',               'final',       1, '2027-01-30 19:00:00+01')
),
inserted as (
  insert into events (slug, name, phase, round_no, starts_at)
  select slug, name, phase, round_no, starts_at from ev
  returning id, phase
)
insert into ticket_categories (event_id, code, label, price_xaf)
select i.id, p.code, p.label, p.price
from inserted i
join (values
  ('first_round'::event_phase, 'standard',    'Standard',    1000),
  ('battle',                   'standard',    'Standard',    1000),
  ('semi_final',               'standard',    'Standard',    2000),
  ('semi_final',               'vip',         'VIP',         5000),
  ('final',                    'standard',    'Standard',    3000),
  ('final',                    'vip',         'VIP',         5000),
  ('final',                    'vip_premium', 'VIP Premium', 10000)
) as p (phase, code, label, price) on p.phase = i.phase;
