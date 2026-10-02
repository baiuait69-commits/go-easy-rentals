-- Production marketplace hardening: owner-defined pricing and transaction tracking
alter table public.anuncios
  alter column preco_dia drop not null;

-- Existing seed/demo prices remain historical data; new listings may omit pricing.
comment on column public.anuncios.preco_dia is
  'Preço diário definido pelo proprietário. Pode ficar NULL enquanto o proprietário não o informar.';

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid references public.reservas(id) on delete set null,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  fornecedor_id uuid references auth.users(id) on delete set null,
  valor numeric(12,2) not null check (valor >= 0),
  comissao numeric(12,2) not null default 0 check (comissao >= 0),
  metodo text not null,
  referencia text,
  estado text not null default 'pendente' check (estado in ('pendente','processando','pago','falhado','estornado')),
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pagamentos_reserva_idx on public.pagamentos(reserva_id);
create index if not exists pagamentos_estado_idx on public.pagamentos(estado, created_at desc);

grant select, insert, update on public.pagamentos to authenticated;
grant all on public.pagamentos to service_role;
alter table public.pagamentos enable row level security;

drop policy if exists "Partes veem pagamentos" on public.pagamentos;
create policy "Partes veem pagamentos"
on public.pagamentos for select to authenticated
using (
  cliente_id = auth.uid()
  or fornecedor_id = auth.uid()
  or private.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Cliente cria pagamento" on public.pagamentos;
create policy "Cliente cria pagamento"
on public.pagamentos for insert to authenticated
with check (
  cliente_id = auth.uid()
  and private.has_role(auth.uid(), 'admin'::public.app_role) = false
);

drop policy if exists "Gestor actualiza pagamentos" on public.pagamentos;
create policy "Gestor actualiza pagamentos"
on public.pagamentos for update to authenticated
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

drop trigger if exists pagamentos_updated_at on public.pagamentos;
create trigger pagamentos_updated_at
before update on public.pagamentos
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pagamentos'
  ) then
    alter publication supabase_realtime add table public.pagamentos;
  end if;
end $$;


create or replace function public.criar_pagamento_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pagamentos (
    reserva_id, cliente_id, fornecedor_id, valor, comissao, metodo, referencia, estado
  ) values (
    new.id, new.cliente_id, new.fornecedor_id, new.total, coalesce(new.comissao, 0),
    new.metodo_pagamento, new.numero, 'pendente'
  );
  return new;
end;
$$;

drop trigger if exists reserva_criar_pagamento on public.reservas;
create trigger reserva_criar_pagamento
after insert on public.reservas
for each row execute function public.criar_pagamento_reserva();


insert into storage.buckets (id, name, public)
values ('verificacao', 'verificacao', false)
on conflict (id) do nothing;

drop policy if exists "Utilizador envia documento" on storage.objects;
create policy "Utilizador envia documento"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'verificacao'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Utilizador ve os seus documentos" on storage.objects;
create policy "Utilizador ve os seus documentos"
on storage.objects for select to authenticated
using (
  bucket_id = 'verificacao'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or private.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
