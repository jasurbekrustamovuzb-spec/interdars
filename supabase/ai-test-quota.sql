-- AI quiz request counters only. This table never stores uploaded files or text.
create table if not exists public.ai_test_usage (
  window_type text not null check (window_type in ('global_day', 'global_minute', 'user_day')),
  period_key text not null,
  bucket_key text not null,
  request_count integer not null default 0 check (request_count >= 0),
  last_requested_at timestamptz,
  reservation_id uuid,
  primary key (window_type, period_key, bucket_key)
);

alter table public.ai_test_usage add column if not exists reservation_id uuid;

alter table public.ai_test_usage enable row level security;
revoke all on table public.ai_test_usage from public, anon, authenticated, service_role;

create or replace function public.consume_ai_test_quota(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz;
  v_local_now timestamp;
  v_day_key text;
  v_minute_key text;
  v_user_key text;
  v_global_day_count integer;
  v_global_minute_count integer;
  v_user_day_count integer;
  v_user_last_request timestamptz;
  v_reservation_id uuid := pg_catalog.gen_random_uuid();
  v_retry_seconds integer;
  v_daily_reset timestamptz;
  v_user_daily_limit constant integer := 5;
  v_global_daily_limit constant integer := 100;
  v_global_minute_limit constant integer := 10;
  v_user_cooldown_seconds constant integer := 20;
begin
  if p_user_id is null then
    return pg_catalog.jsonb_build_object('allowed', false, 'reason', 'invalid_user', 'retryAfterSeconds', 60);
  end if;

  v_now := pg_catalog.clock_timestamp();
  v_local_now := pg_catalog.timezone('America/Los_Angeles', v_now);
  v_day_key := pg_catalog.to_char(v_local_now, 'YYYY-MM-DD');
  v_minute_key := pg_catalog.to_char(v_local_now, 'YYYY-MM-DD"T"HH24:MI');
  v_user_key := p_user_id::text;
  v_daily_reset := ((v_local_now::date + 1)::timestamp) at time zone 'America/Los_Angeles';

  -- Keep only 35 days of daily counters and two hours of minute counters.
  delete from public.ai_test_usage
  where (window_type = 'global_minute'
         and period_key < pg_catalog.to_char(v_local_now - interval '2 hours', 'YYYY-MM-DD"T"HH24:MI'))
     or (window_type <> 'global_minute'
         and period_key < pg_catalog.to_char(v_local_now::date - 35, 'YYYY-MM-DD'));

  insert into public.ai_test_usage (window_type, period_key, bucket_key, request_count)
  values
    ('global_day', v_day_key, 'all', 0),
    ('global_minute', v_minute_key, 'all', 0),
    ('user_day', v_day_key, v_user_key, 0)
  on conflict (window_type, period_key, bucket_key) do nothing;

  -- Lock all buckets in the same order so concurrent calls cannot overshoot limits.
  select request_count into v_global_day_count
  from public.ai_test_usage
  where window_type = 'global_day' and period_key = v_day_key and bucket_key = 'all'
  for update;

  select request_count into v_global_minute_count
  from public.ai_test_usage
  where window_type = 'global_minute' and period_key = v_minute_key and bucket_key = 'all'
  for update;

  select request_count, last_requested_at into v_user_day_count, v_user_last_request
  from public.ai_test_usage
  where window_type = 'user_day' and period_key = v_day_key and bucket_key = v_user_key
  for update;

  if v_global_minute_count >= v_global_minute_limit then
    v_retry_seconds := greatest(1, 60 - floor(pg_catalog.date_part('second', v_local_now))::integer);
    return pg_catalog.jsonb_build_object('allowed', false, 'reason', 'global_minute', 'retryAfterSeconds', v_retry_seconds);
  end if;

  if v_global_day_count >= v_global_daily_limit then
    v_retry_seconds := greatest(1, ceil(pg_catalog.date_part('epoch', v_daily_reset - v_now))::integer);
    return pg_catalog.jsonb_build_object('allowed', false, 'reason', 'global_daily', 'retryAfterSeconds', v_retry_seconds);
  end if;

  if v_user_day_count >= v_user_daily_limit then
    v_retry_seconds := greatest(1, ceil(pg_catalog.date_part('epoch', v_daily_reset - v_now))::integer);
    return pg_catalog.jsonb_build_object('allowed', false, 'reason', 'user_daily', 'retryAfterSeconds', v_retry_seconds);
  end if;

  if v_user_last_request is not null
     and v_user_last_request + pg_catalog.make_interval(secs => v_user_cooldown_seconds) > v_now then
    v_retry_seconds := greatest(1, ceil(pg_catalog.date_part('epoch', v_user_last_request + pg_catalog.make_interval(secs => v_user_cooldown_seconds) - v_now))::integer);
    return pg_catalog.jsonb_build_object('allowed', false, 'reason', 'user_cooldown', 'retryAfterSeconds', v_retry_seconds);
  end if;

  update public.ai_test_usage
  set request_count = request_count + 1, last_requested_at = v_now
  where window_type = 'global_day' and period_key = v_day_key and bucket_key = 'all';

  update public.ai_test_usage
  set request_count = request_count + 1, last_requested_at = v_now
  where window_type = 'global_minute' and period_key = v_minute_key and bucket_key = 'all';

  update public.ai_test_usage
  set request_count = request_count + 1, last_requested_at = v_now, reservation_id = v_reservation_id
  where window_type = 'user_day' and period_key = v_day_key and bucket_key = v_user_key;

  return pg_catalog.jsonb_build_object(
    'allowed', true,
    'remaining', greatest(0, v_user_daily_limit - v_user_day_count - 1),
    'globalDailyRemaining', greatest(0, v_global_daily_limit - v_global_day_count - 1),
    'reservationId', v_reservation_id
  );
end;
$$;

revoke all on function public.consume_ai_test_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_test_quota(uuid) to service_role;

create or replace function public.refund_ai_test_user_quota(p_user_id uuid, p_reservation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refunded boolean := false;
begin
  if p_user_id is null or p_reservation_id is null then
    return pg_catalog.jsonb_build_object('refunded', false);
  end if;

  update public.ai_test_usage
  set request_count = request_count - 1, reservation_id = null
  where window_type = 'user_day'
    and bucket_key = p_user_id::text
    and reservation_id = p_reservation_id
    and request_count > 0;

  v_refunded := found;
  return pg_catalog.jsonb_build_object('refunded', v_refunded);
end;
$$;

revoke all on function public.refund_ai_test_user_quota(uuid, uuid) from public, anon, authenticated;
grant execute on function public.refund_ai_test_user_quota(uuid, uuid) to service_role;

