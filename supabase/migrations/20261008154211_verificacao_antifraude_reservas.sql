-- Verification, anti-fraud and delivery/payment hardening
-- Existing listings remain published; only new listings/reservations are subject to the new checks.

create table if not exists public.documentos_verificacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  ficheiro_url text not null,
  estado text not null default 'pendente' check (estado in ('pendente','aprovado','rejeitado')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verificacao_historico (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id),
  campo text not null,
  valor_anterior text,
  valor_novo text,
  motivo text,
  created_at timestamptz not null default now()
);

create table if not exists public.alertas_antifraude (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anuncio_id uuid references public.anuncios(id) on delete set null,
  reserva_id uuid references public.reservas(id) on delete set null,
  tipo text not null,
  severidade text not null default 'media' check (severidade in ('baixa','media','alta')),
  mensagem text not null,
  estado text not null default 'aberto' check (estado in ('aberto','em_revisao','resolvido','ignorado')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.perfis
  add column if not exists data_nascimento date,
  add column if not exists morada text,
  add column if not exists documento_tipo text,
  add column if not exists documento_numero text,
  add column if not exists documento_frente_url text,
  add column if not exists documento_verso_url text,
  add column if not exists selfie_url text,
  add column if not exists nif text,
  add column if not exists iban text,
  add column if not exists certidao_url text,
  add column if not exists alvara_url text,
  add column if not exists representante_legal text,
  add column if not exists verificacao_estado text not null default 'pendente'
    check (verificacao_estado in ('pendente','aprovado','rejeitado'));

alter table public.anuncios
  add column if not exists titularidade text,
  add column if not exists titular_nome text,
  add column if not exists vin_chassis text,
  add column if not exists matricula text,
  add column if not exists numero_serie text,
  add column if not exists codigo_temporario text,
  add column if not exists fotos_obrigatorias_ok boolean not null default false,
  add column if not exists antifraude_estado text not null default 'pendente'
    check (antifraude_estado in ('pendente','aprovado','rejeitado','bloqueado'));

alter table public.reservas
  add column if not exists nivel_risco text not null default 'baixo'
    check (nivel_risco in ('baixo','medio','alto')),
  add column if not exists bloqueada_antifraude boolean not null default false,
  add column if not exists estado_pagamento text not null default 'pendente'
    check (estado_pagamento in ('pendente','retido','confirmado','reembolsado','pago_fornecedor')),
  add column if not exists entregue_em timestamptz,
  add column if not exists recepcao_confirmada_em timestamptz,
  add column if not exists recepcao_confirmada_por uuid references auth.users(id);

create index if not exists documentos_verificacao_user_idx on public.documentos_verificacao(user_id);
create index if not exists alertas_antifraude_estado_idx on public.alertas_antifraude(estado, severidade);
create index if not exists alertas_antifraude_user_idx on public.alertas_antifraude(user_id);
create index if not exists anuncios_vin_idx on public.anuncios(vin_chassis) where vin_chassis is not null;
create index if not exists anuncios_matricula_idx on public.anuncios(matricula) where matricula is not null;
create index if not exists anuncios_serie_idx on public.anuncios(numero_serie) where numero_serie is not null;
create index if not exists reservas_risco_idx on public.reservas(nivel_risco, bloqueada_antifraude);

alter table public.documentos_verificacao enable row level security;
alter table public.verificacao_historico enable row level security;
alter table public.alertas_antifraude enable row level security;

grant select, insert, update on public.documentos_verificacao to authenticated;
grant select on public.verificacao_historico to authenticated;
grant select on public.alertas_antifraude to authenticated;

drop policy if exists "documents own access" on public.documentos_verificacao;
create policy "documents own access" on public.documentos_verificacao
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "verification history own read" on public.verificacao_historico;
create policy "verification history own read" on public.verificacao_historico
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "antifraud own read" on public.alertas_antifraude;
create policy "antifraud own read" on public.alertas_antifraude
for select to authenticated
using (
  (select auth.uid()) = user_id
  or public.has_role('admin', (select auth.uid()))
  or public.has_role('suporte', (select auth.uid()))
);

create or replace function public.verificacao_reserva_guard()
returns trigger
language plpgsql
as $$
declare
  cliente_verificado boolean;
  fornecedor_verificado boolean;
begin
  select coalesce(verificado, false) and verificacao_estado = 'aprovado'
    into cliente_verificado
  from public.perfis where id = new.cliente_id;

  if not cliente_verificado then
    raise exception 'A sua identidade ainda não foi aprovada. Abra Perfil > Verificação antes de reservar.';
  end if;

  select coalesce(p.verificado, false) and p.verificacao_estado = 'aprovado'
    into fornecedor_verificado
  from public.anuncios a
  left join public.perfis p on p.id = a.owner_id
  where a.id = new.anuncio_id;

  if not fornecedor_verificado then
    raise exception 'O fornecedor deste anúncio ainda não está aprovado.';
  end if;

  return new;
end;
$$;

drop trigger if exists a_verificacao_reserva_guard on public.reservas;
create trigger a_verificacao_reserva_guard
before insert on public.reservas
for each row execute function public.verificacao_reserva_guard();

create or replace function public.anuncio_antifraude_guard()
returns trigger
language plpgsql
as $$
declare
  owner_ok boolean;
begin
  select coalesce(verificado, false) and verificacao_estado = 'aprovado'
    into owner_ok from public.perfis where id = new.owner_id;

  if not owner_ok then
    raise exception 'O fornecedor precisa de aprovação em Verificação antes de publicar um novo anúncio.';
  end if;

  new.estado := 'pendente';
  new.antifraude_estado := 'pendente';

  if new.descricao is not null and lower(new.descricao) ~ '(whatsapp|transfer[eê]ncia|fora da plataforma)' then
    new.antifraude_estado := 'bloqueado';
    insert into public.alertas_antifraude(user_id, anuncio_id, tipo, severidade, mensagem)
    values (new.owner_id, new.id, 'contacto_externo', 'alta', 'A descrição contém indicação de contacto ou pagamento fora da plataforma.');
  end if;

  return new;
end;
$$;

drop trigger if exists a_anuncio_antifraude_guard on public.anuncios;
create trigger a_anuncio_antifraude_guard
before insert on public.anuncios
for each row execute function public.anuncio_antifraude_guard();

create or replace function public.reserva_risco_guard()
returns trigger
language plpgsql
as $$
declare
  texto text;
  risco text := 'baixo';
begin
  texto := lower(coalesce(new.comentario,'') || ' ' || coalesce(new.metodo_pagamento,''));
  if texto ~ '(whatsapp|transfer[eê]ncia|fora da plataforma)' then
    risco := 'alto';
  elsif texto <> '' then
    risco := 'medio';
  end if;

  new.nivel_risco := risco;
  new.bloqueada_antifraude := risco = 'alto';

  if risco = 'alto' then
    insert into public.alertas_antifraude(user_id, reserva_id, tipo, severidade, mensagem)
    values (new.cliente_id, new.id, 'reserva_alto_risco', 'alta', 'Reserva bloqueada para revisão do gestor.');
  end if;

  return new;
end;
$$;

drop trigger if exists a_reserva_risco_guard on public.reservas;
create trigger a_reserva_risco_guard
before insert on public.reservas
for each row execute function public.reserva_risco_guard();
