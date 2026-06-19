SELECT cron.schedule(
  'escalate-tickets-hourly',
  '0 * * * *',
  $$SELECT net.http_post(
      url:='https://project--ee5c4ca0-d29f-4b86-afa5-ff840f1d7d89.lovable.app/api/public/hooks/escalate-tickets',
      headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2pmbGVjdHdrYnJ2aWZ4eXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc2NTIsImV4cCI6MjA5NTUzMzY1Mn0.s1aAEDD4IKisIM44DdsX4eLLcQTUtb1NQjRq8v5c0Fw"}'::jsonb,
      body:='{}'::jsonb
    );$$
);