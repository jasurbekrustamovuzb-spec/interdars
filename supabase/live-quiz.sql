-- InterDars live quiz rooms. Room PINs are separate from ordinary lesson IDs.
create table if not exists public.live_quiz_rooms (
  id uuid primary key default gen_random_uuid(),
  pin text not null unique check (pin ~ '^[0-9]{6}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 3 and 80),
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'waiting' check (status in ('waiting','question','reveal','leaderboard','podium','cancelled')),
  question_index integer not null default 0 check (question_index >= 0),
  question_started_at timestamptz,
  question_ends_at timestamptz,
  phase_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.live_quiz_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.live_quiz_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar text not null default '🦊',
  score integer not null default 0 check (score >= 0),
  answers jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index if not exists live_quiz_players_room_score_idx
  on public.live_quiz_players (room_id, score desc, joined_at);

alter table public.live_quiz_rooms enable row level security;
alter table public.live_quiz_players enable row level security;

drop policy if exists live_quiz_rooms_host_read on public.live_quiz_rooms;
create policy live_quiz_rooms_host_read on public.live_quiz_rooms for select to authenticated
  using (host_id = (select auth.uid()));
drop policy if exists live_quiz_rooms_host_update on public.live_quiz_rooms;
create policy live_quiz_rooms_host_update on public.live_quiz_rooms for update to authenticated
  using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
drop policy if exists live_quiz_players_host_or_self_read on public.live_quiz_players;
create policy live_quiz_players_host_or_self_read on public.live_quiz_players for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.live_quiz_rooms r where r.id = public.live_quiz_players.room_id and r.host_id = (select auth.uid())
  ));

revoke all on public.live_quiz_rooms from anon, authenticated;
revoke all on public.live_quiz_players from anon, authenticated;
grant select, update on public.live_quiz_rooms to authenticated;
grant select on public.live_quiz_players to authenticated;

create or replace function public.live_quiz_state(p_room_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  r public.live_quiz_rooms%rowtype;
  v_question jsonb;
  v_players jsonb;
  v_me jsonb;
  v_answer jsonb;
begin
  select * into r from public.live_quiz_rooms where id = p_room_id;
  if not found then return null; end if;
  if r.host_id <> (select auth.uid()) and not exists (
    select 1 from public.live_quiz_players p where p.room_id = r.id and p.user_id = (select auth.uid())
  ) then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ranked.id, 'name', ranked.nickname, 'avatar', ranked.avatar, 'score', ranked.score,
    'answered', coalesce(ranked.answers ? r.question_index::text, false), 'rank', ranked.rank
  ) order by ranked.score desc, ranked.joined_at asc), '[]'::jsonb)
    into v_players
    from (select p.*, row_number() over (order by p.score desc, p.joined_at asc)::integer as rank
          from public.live_quiz_players p where p.room_id = r.id) ranked;

  v_question := r.questions -> r.question_index;
  if v_question is not null then
    v_question := jsonb_build_object('text', v_question->'q', 'choices', v_question->'a',
      'index', r.question_index + 1, 'total', jsonb_array_length(r.questions));
    if r.status in ('reveal','leaderboard','podium') then
      v_question := v_question || jsonb_build_object('correctIndex', (r.questions->r.question_index)->'c');
    end if;
  end if;

  select p.answers -> r.question_index::text into v_answer
    from public.live_quiz_players p where p.room_id = r.id and p.user_id = (select auth.uid());
  select jsonb_build_object('id',p.id,'name',p.nickname,'avatar',p.avatar,'score',p.score,'answer',v_answer,
    'correctCount',(select count(*) from jsonb_each(p.answers) a where coalesce((a.value->>'correct')::boolean,false)),
    'total',jsonb_array_length(r.questions))
    into v_me from public.live_quiz_players p where p.room_id = r.id and p.user_id = (select auth.uid());

  return jsonb_build_object('id',r.id,'pin',r.pin,'title',r.title,'hostId',r.host_id,
    'status',r.status,'questionIndex',r.question_index,'settings',r.settings,'question',v_question,
    'participants',v_players,'me',v_me,'questionEndsAt',r.question_ends_at,'phaseEndsAt',r.phase_ends_at);
end $$;

create or replace function public.live_quiz_create(p_title text, p_questions jsonb, p_settings jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room public.live_quiz_rooms%rowtype; v_pin text; v_q jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Tizimga kiring'; end if;
  if p_questions is null or jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) not between 3 and 80 then
    raise exception 'Jonli test uchun 3–80 ta savol kerak';
  end if;
  for v_q in select value from jsonb_array_elements(p_questions) loop
    if coalesce(length(v_q->>'q'),0) = 0 or jsonb_typeof(v_q->'a') <> 'array'
      or jsonb_array_length(v_q->'a') not between 2 and 4
      or coalesce((v_q->>'c')::integer,-1) < 0
      or (v_q->>'c')::integer >= jsonb_array_length(v_q->'a') then
      raise exception 'Savollardan birining matni yoki javoblari noto’g’ri';
    end if;
  end loop;
  loop
    v_pin := (100000 + floor(random() * 900000)::integer)::text;
    exit when not exists (select 1 from public.live_quiz_rooms where pin = v_pin and status <> 'cancelled');
  end loop;
  insert into public.live_quiz_rooms(host_id,title,questions,settings,pin)
    values ((select auth.uid()),left(trim(p_title),180),p_questions,
      jsonb_build_object('question_seconds',greatest(5,least(120,coalesce((p_settings->>'question_seconds')::integer,20))),
        'gap_seconds',greatest(1,least(10,coalesce((p_settings->>'gap_seconds')::integer,3))),
        'scoring',case when p_settings->>'scoring'='accuracy' then 'accuracy' else 'speed' end),v_pin)
    returning * into v_room;
  return jsonb_build_object('id',v_room.id,'pin',v_room.pin,'status',v_room.status);
end $$;

create or replace function public.live_quiz_join(p_pin text,p_nickname text,p_avatar text default '🦊')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room public.live_quiz_rooms%rowtype; v_name text;
begin
  if (select auth.uid()) is null then raise exception 'Avval tizimga kiring'; end if;
  select * into v_room from public.live_quiz_rooms where pin = p_pin and status = 'waiting' for update;
  if not found then raise exception 'Xona kodi topilmadi yoki test allaqachon boshlangan'; end if;
  v_name := left(trim(coalesce(p_nickname,'')),24);
  if v_name = '' then raise exception 'Ismni kiriting'; end if;
  insert into public.live_quiz_players(room_id,user_id,nickname,avatar)
    values(v_room.id,(select auth.uid()),v_name,left(coalesce(p_avatar,'🦊'),16))
    on conflict(room_id,user_id) do update set nickname=excluded.nickname,avatar=excluded.avatar;
  return public.live_quiz_state(v_room.id);
end $$;

create or replace function public.live_quiz_profile(p_room_id uuid,p_nickname text,p_avatar text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room public.live_quiz_rooms%rowtype;
begin
  select * into v_room from public.live_quiz_rooms where id=p_room_id for update;
  if not found or v_room.status <> 'waiting' then raise exception 'Ism va avatarni faqat kutish xonasida o’zgartirish mumkin'; end if;
  update public.live_quiz_players set nickname=left(trim(p_nickname),24),avatar=left(coalesce(p_avatar,'🦊'),16)
    where room_id=p_room_id and user_id=(select auth.uid()) and char_length(trim(p_nickname)) between 1 and 24;
  if not found then raise exception 'Ism 1–24 belgi bo’lishi kerak'; end if;
  return public.live_quiz_state(p_room_id);
end $$;

create or replace function public.live_quiz_answer(p_room_id uuid,p_choice integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.live_quiz_rooms%rowtype; p public.live_quiz_players%rowtype; v_q jsonb; v_correct boolean; v_points integer; v_elapsed integer; v_seconds integer;
begin
  select * into r from public.live_quiz_rooms where id=p_room_id for update;
  if not found or r.status <> 'question' or r.question_ends_at < now() then raise exception 'Javob berish vaqti tugadi'; end if;
  select * into p from public.live_quiz_players where room_id=p_room_id and user_id=(select auth.uid()) for update;
  if not found then raise exception 'Siz bu xonaga qo’shilmagansiz'; end if;
  if p.answers ? r.question_index::text then raise exception 'Javobingiz qabul qilingan'; end if;
  v_q := r.questions->r.question_index;
  if p_choice < 0 or p_choice >= jsonb_array_length(v_q->'a') then raise exception 'Javob varianti noto’g’ri'; end if;
  v_correct := p_choice = (v_q->>'c')::integer;
  v_seconds := greatest(1,coalesce((r.settings->>'question_seconds')::integer,20));
  v_elapsed := greatest(0,(extract(epoch from (clock_timestamp()-r.question_started_at))*1000)::integer);
  v_points := case when not v_correct then 0 when r.settings->>'scoring'='accuracy' or v_elapsed<500 then 1000
    else greatest(0,round(1000*(1-least(v_elapsed::numeric,v_seconds*1000)::numeric/(v_seconds*2000)))::integer) end;
  update public.live_quiz_players set score=score+v_points,
    answers=answers||jsonb_build_object(r.question_index::text,jsonb_build_object('choice',p_choice,'correct',v_correct,'points',v_points,'elapsedMs',v_elapsed))
    where id=p.id;
  return jsonb_build_object('correct',v_correct,'points',v_points,'state',public.live_quiz_state(p_room_id));
end $$;

drop function if exists public.live_quiz_advance(uuid);
create or replace function public.live_quiz_advance(p_room_id uuid,p_start boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.live_quiz_rooms%rowtype; v_gap integer; v_seconds integer; v_count integer;
begin
  select * into r from public.live_quiz_rooms where id=p_room_id for update;
  if not found or r.host_id <> (select auth.uid()) then raise exception 'Faqat xona tuzuvchisi boshqaradi'; end if;
  v_gap := greatest(1,least(10,coalesce((r.settings->>'gap_seconds')::integer,3)));
  v_seconds := greatest(5,least(120,coalesce((r.settings->>'question_seconds')::integer,20)));
  if r.status='waiting' then
    if not p_start then return public.live_quiz_state(p_room_id); end if;
    select count(*) into v_count from public.live_quiz_players where room_id=r.id;
    if v_count=0 then raise exception 'Boshlash uchun ishtirokchilar qo’shilsin'; end if;
    update public.live_quiz_rooms set status='question',question_index=0,question_started_at=now(),question_ends_at=now()+make_interval(secs=>v_seconds),phase_ends_at=null where id=r.id;
  elsif r.status='question' and r.question_ends_at<=now() then
    update public.live_quiz_rooms set status='reveal',phase_ends_at=now()+make_interval(secs=>v_gap) where id=r.id;
  elsif r.status='reveal' and r.phase_ends_at<=now() then
    update public.live_quiz_rooms set status='leaderboard',phase_ends_at=now()+make_interval(secs=>v_gap) where id=r.id;
  elsif r.status='leaderboard' and r.phase_ends_at<=now() then
    if r.question_index+1>=jsonb_array_length(r.questions) then
      update public.live_quiz_rooms set status='podium',phase_ends_at=null where id=r.id;
    else
      update public.live_quiz_rooms set status='question',question_index=question_index+1,question_started_at=now(),question_ends_at=now()+make_interval(secs=>v_seconds),phase_ends_at=null where id=r.id;
    end if;
  end if;
  return public.live_quiz_state(p_room_id);
end $$;

create or replace function public.live_quiz_close(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  update public.live_quiz_rooms set status='cancelled',phase_ends_at=null
    where id=p_room_id and host_id=(select auth.uid()) and status not in ('podium','cancelled');
  if not found then raise exception 'Xonani yopib bo’lmadi'; end if;
  return public.live_quiz_state(p_room_id);
end $$;

create or replace function public.live_quiz_leave(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
  select status into v_status from public.live_quiz_rooms where id=p_room_id;
  if v_status='waiting' then
    delete from public.live_quiz_players where room_id=p_room_id and user_id=(select auth.uid());
    return jsonb_build_object('left',true);
  end if;
  return jsonb_build_object('left',false);
end $$;

revoke all on function public.live_quiz_state(uuid) from public,anon;
revoke all on function public.live_quiz_create(text,jsonb,jsonb) from public,anon;
revoke all on function public.live_quiz_join(text,text,text) from public,anon;
revoke all on function public.live_quiz_profile(uuid,text,text) from public,anon;
revoke all on function public.live_quiz_answer(uuid,integer) from public,anon;
revoke all on function public.live_quiz_advance(uuid,boolean) from public,anon;
revoke all on function public.live_quiz_close(uuid) from public,anon;
revoke all on function public.live_quiz_leave(uuid) from public,anon;
grant execute on function public.live_quiz_state(uuid) to authenticated;
grant execute on function public.live_quiz_create(text,jsonb,jsonb) to authenticated;
grant execute on function public.live_quiz_join(text,text,text) to authenticated;
grant execute on function public.live_quiz_profile(uuid,text,text) to authenticated;
grant execute on function public.live_quiz_answer(uuid,integer) to authenticated;
grant execute on function public.live_quiz_advance(uuid,boolean) to authenticated;
grant execute on function public.live_quiz_close(uuid) to authenticated;
grant execute on function public.live_quiz_leave(uuid) to authenticated;

