create table if not exists public.admin_reservations (
  id text primary key,
  client_name text not null,
  vehicle_id text,
  vehicle_name text,
  period text,
  total numeric not null default 0,
  commission numeric not null default 0,
  status text not null default 'Pendente' check (status in ('Pendente','Confirmada','Em curso','Concluída','Cancelada')),
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_partners (
  id text primary key,
  name text not null,
  nif text,
  zone text,
  fleet integer not null default 0,
  status text not null default 'Pendente' check (status in ('Pendente','Aprovado','Suspenso','Rejeitado')),
  plan text,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_user_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists admin_reservations_status_idx on public.admin_reservations(status);
create index if not exists admin_reservations_created_at_idx on public.admin_reservations(created_at desc);

alter table public.admin_reservations enable row level security;
alter table public.admin_partners enable row level security;
alter table public.admin_user_status enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create policy "admins can read reservations"
on public.admin_reservations for select using (public.is_admin());
create policy "admins can update reservations"
on public.admin_reservations for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can read partners"
on public.admin_partners for select using (public.is_admin());
create policy "admins can update partners"
on public.admin_partners for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can read user status"
on public.admin_user_status for select using (public.is_admin());
create policy "admins can insert user status"
on public.admin_user_status for insert with check (public.is_admin());
create policy "admins can update user status"
on public.admin_user_status for update using (public.is_admin()) with check (public.is_admin());
