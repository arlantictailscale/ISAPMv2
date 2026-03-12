-- Update event_quotas to use correct event_id values (without hyphens) to match event-pricing.ts
UPDATE event_quotas SET event_id = 'ws1' WHERE event_id = 'ws-1';
UPDATE event_quotas SET event_id = 'ws2' WHERE event_id = 'ws-2';
UPDATE event_quotas SET event_id = 'ws3' WHERE event_id = 'ws-3';
UPDATE event_quotas SET event_id = 'ws4' WHERE event_id = 'ws-4';
UPDATE event_quotas SET event_id = 'ws5' WHERE event_id = 'ws-5';
UPDATE event_quotas SET event_id = 'ws6' WHERE event_id = 'ws-6';
UPDATE event_quotas SET event_id = 'ws7' WHERE event_id = 'ws-7';
UPDATE event_quotas SET event_id = 'city-tour' WHERE event_id = 'city-tour';
