-- Proactive agent follow-ups (memory-driven check-ins) + in-app notifications

create table if not exists public.agent_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  topic text not null,
  context text not null,
  reason text not null default 'general_checkin',
  event_at timestamptz,
  notify_at timestamptz not null,
  confidence numeric not null default 0.8 check (confidence >= 0 and confidence <= 1),
  status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled')),
  source_memory_id uuid references public.user_memories(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_followups_due
  on public.agent_followups (notify_at)
  where status = 'pending';

create index if not exists idx_agent_followups_user_agent
  on public.agent_followups (user_id, agent_id, status);

alter table public.agent_followups enable row level security;

create policy "Users manage own followups"
  on public.agent_followups
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text,
  type text not null default 'agent_followup' check (type in ('agent_followup', 'system')),
  title text not null,
  body text not null,
  followup_id uuid references public.agent_followups(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_created
  on public.user_notifications (user_id, created_at desc);

create index if not exists idx_user_notifications_unread
  on public.user_notifications (user_id)
  where read_at is null;

alter table public.user_notifications enable row level security;

create policy "Users manage own notifications"
  on public.user_notifications
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
