create table if not exists public.documentos_verificacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('bilhete_identidade', 'carta_conducao', 'nif', 'registo_comercial', 'outro')),
  numero text,
  ficheiro_url text not null,
  estado text not null default 'pendente' check (estado in ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index if not exists documentos_verificacao_estado_idx on public.documentos_verificacao(estado, created_at desc);
create index if not exists documentos_verificacao_user_idx on public.documentos_verificacao(user_id);

create table if not exists public.categorias_marketplace (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.categorias_marketplace (slug, nome, descricao, ordem)
values
  ('veiculos', 'Veículos', 'Carros, carrinhas e viaturas ligeiras.', 1),
  ('transporte', 'Transporte', 'Soluções de transporte e mobilidade.', 2),
  ('pesados', 'Pesados', 'Camiões, autocarros e veículos pesados.', 3),
  ('maquinas', 'Máquinas', 'Máquinas e equipamentos para aluguer.', 4),
  ('servicos', 'Serviços', 'Serviços associados ao marketplace.', 5)
on conflict (slug) do update set nome = excluded.nome;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documentos_verificacao_updated_at on public.documentos_verificacao;
create trigger documentos_verificacao_updated_at
before update on public.documentos_verificacao
for each row execute function public.set_updated_at();

drop trigger if exists categorias_marketplace_updated_at on public.categorias_marketplace;
create trigger categorias_marketplace_updated_at
before update on public.categorias_marketplace
for each row execute function public.set_updated_at();

alter table public.documentos_verificacao enable row level security;
alter table public.categorias_marketplace enable row level security;

drop policy if exists "documentos_owner_select" on public.documentos_verificacao;
create policy "documentos_owner_select" on public.documentos_verificacao
for select to authenticated
using (user_id = auth.uid() or public.has_role('admin', auth.uid()));

drop policy if exists "documentos_admin_all" on public.documentos_verificacao;
create policy "documentos_admin_all" on public.documentos_verificacao
for all to authenticated
using (public.has_role('admin', auth.uid()))
with check (public.has_role('admin', auth.uid()));

drop policy if exists "categorias_public_select" on public.categorias_marketplace;
create policy "categorias_public_select" on public.categorias_marketplace
for select to authenticated
using (ativo = true or public.has_role('admin', auth.uid()));

drop policy if exists "categorias_admin_all" on public.categorias_marketplace;
create policy "categorias_admin_all" on public.categorias_marketplace
for all to authenticated
using (public.has_role('admin', auth.uid()))
with check (public.has_role('admin', auth.uid()));
