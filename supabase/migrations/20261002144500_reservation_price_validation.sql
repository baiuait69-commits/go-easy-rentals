-- Validate customer booking totals against the current owner-defined price.
-- Never trust title/image/location/caution/total sent by the browser.

create or replace function public.validar_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean := private.has_role(auth.uid(), 'admin'::public.app_role);
  actor_is_provider boolean;
  overlap_exists boolean;
  ad_owner uuid;
  ad_state public.anuncio_estado;
  ad_available boolean;
  ad_title text;
  ad_image text;
  ad_municipio text;
  ad_caucao numeric;
  ad_preco_hora numeric;
  ad_preco_dia numeric;
  ad_preco_semana numeric;
  ad_preco_mes numeric;
  periodo text;
  expected_total numeric;
  old_seconds numeric;
  delta_seconds numeric;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or new.cliente_id <> auth.uid() then
      raise exception 'Só o cliente autenticado pode criar a reserva';
    end if;

    if new.avaliacao is not null then
      raise exception 'Uma reserva nova não pode ter avaliação';
    end if;

    if new.inicio < now() - interval '1 hour' then
      raise exception 'A data de início já passou';
    end if;

    if new.anuncio_id is null then
      raise exception 'A reserva tem de estar associada a um anúncio';
    end if;

    select
      a.owner_id, a.estado, a.disponivel, a.titulo, a.imagem, a.municipio,
      a.caucao, a.preco_hora, a.preco_dia, a.preco_semana, a.preco_mes
    into
      ad_owner, ad_state, ad_available, ad_title, ad_image, ad_municipio,
      ad_caucao, ad_preco_hora, ad_preco_dia, ad_preco_semana, ad_preco_mes
    from public.anuncios a
    where a.id = new.anuncio_id
    for share;

    if not found then
      raise exception 'Anúncio não encontrado';
    end if;

    if ad_owner is null or ad_owner = new.cliente_id then
      raise exception 'O anúncio não pode ser reservado pelo próprio proprietário';
    end if;

    if ad_state <> 'aprovado' or not ad_available then
      raise exception 'Este anúncio não está disponível para reserva';
    end if;

    new.fornecedor_id := ad_owner;
    new.item_ref := new.anuncio_id::text;
    new.titulo := ad_title;
    new.imagem := ad_image;
    new.local := ad_municipio;
    new.caucao := coalesce(ad_caucao, 0);
    new.estado := 'pendente';

    periodo := lower(coalesce(new.extras->>'periodo', 'dia'));

    if periodo = 'hora' then
      if ad_preco_hora is null then
        raise exception 'Este anúncio não tem preço por hora definido';
      end if;
      expected_total := ceil(extract(epoch from (new.fim - new.inicio)) / 3600.0) * ad_preco_hora;
    elsif periodo = 'dia' then
      if ad_preco_dia is null then
        raise exception 'Este anúncio não tem preço diário definido';
      end if;
      expected_total := ceil(extract(epoch from (new.fim - new.inicio)) / 86400.0) * ad_preco_dia;
    elsif periodo = 'semana' then
      if ad_preco_semana is null then
        raise exception 'Este anúncio não tem preço semanal definido';
      end if;
      expected_total := ceil(extract(epoch from (new.fim - new.inicio)) / 604800.0) * ad_preco_semana;
    elsif periodo = 'mes' then
      if ad_preco_mes is null then
        raise exception 'Este anúncio não tem preço mensal definido';
      end if;
      expected_total := ceil(extract(epoch from (new.fim - new.inicio)) / 2592000.0) * ad_preco_mes;
    else
      raise exception 'Período de reserva inválido';
    end if;

    if round(coalesce(new.total, -1)::numeric, 2) <> round(expected_total::numeric, 2) then
      raise exception 'O valor da reserva não corresponde ao preço do anúncio';
    end if;

    perform pg_advisory_xact_lock(hashtext(new.anuncio_id::text));

    select exists (
      select 1
      from public.reservas r
      where r.anuncio_id = new.anuncio_id
        and r.estado in ('confirmada','em_utilizacao')
        and r.inicio < new.fim
        and r.fim > new.inicio
    ) into overlap_exists;

    if overlap_exists then
      raise exception 'A viatura já está reservada nesse período';
    end if;

    return new;
  end if;

  actor_is_provider := auth.uid() = old.fornecedor_id;

  if new.cliente_id <> old.cliente_id
     or new.fornecedor_id is distinct from old.fornecedor_id
     or new.anuncio_id is distinct from old.anuncio_id
     or new.inicio <> old.inicio
     or new.item_ref <> old.item_ref
     or new.titulo <> old.titulo
     or new.imagem is distinct from old.imagem
     or new.local is distinct from old.local
     or new.caucao <> old.caucao
     or new.metodo_pagamento <> old.metodo_pagamento
     or new.numero <> old.numero
     or new.extras is distinct from old.extras
     or new.created_at <> old.created_at
  then
    if not is_admin then
      raise exception 'Campos da reserva não podem ser alterados';
    end if;
  end if;

  if is_admin then
    new.updated_at := now();
    return new;
  end if;

  if actor_is_provider then
    if new.total <> old.total or new.fim <> old.fim
       or new.avaliacao is distinct from old.avaliacao
       or new.comentario is distinct from old.comentario then
      raise exception 'O fornecedor não pode alterar valor, período ou avaliação';
    end if;

    if not (
      (old.estado = 'pendente' and new.estado in ('confirmada','rejeitada'))
      or (old.estado = 'confirmada' and new.estado = 'em_utilizacao')
      or (old.estado = 'em_utilizacao' and new.estado = 'concluida')
      or (new.estado = old.estado)
    ) then
      raise exception 'Transição de estado do fornecedor não permitida';
    end if;

    if new.estado = 'confirmada' and old.estado <> 'confirmada' then
      perform pg_advisory_xact_lock(hashtext(old.anuncio_id::text));
      select exists (
        select 1
        from public.reservas r
        where r.id <> old.id
          and r.anuncio_id = old.anuncio_id
          and r.estado in ('confirmada','em_utilizacao')
          and r.inicio < old.fim
          and r.fim > old.inicio
      ) into overlap_exists;

      if overlap_exists then
        raise exception 'Já existe outra reserva confirmada nesse período';
      end if;
    end if;

    new.updated_at := now();
    return new;
  end if;

  if new.estado <> old.estado then
    if not (new.estado = 'cancelada' and old.estado in ('pendente','confirmada')) then
      raise exception 'Só pode cancelar reservas pendentes ou confirmadas';
    end if;

    if new.fim <> old.fim or new.total <> old.total then
      raise exception 'Não pode cancelar e estender a reserva ao mesmo tempo';
    end if;
  end if;

  if new.fim <> old.fim then
    if old.estado not in ('confirmada','em_utilizacao') or new.fim <= old.fim then
      raise exception 'Só pode estender reservas activas';
    end if;

    old_seconds := extract(epoch from (old.fim - old.inicio));
    delta_seconds := extract(epoch from (new.fim - old.fim));
    expected_total := round((old.total + (old.total / old_seconds) * delta_seconds)::numeric, 2);

    if new.total <> expected_total then
      raise exception 'O valor da extensão não corresponde ao período acrescentado';
    end if;

    perform pg_advisory_xact_lock(hashtext(old.anuncio_id::text));

    select exists (
      select 1
      from public.reservas r
      where r.id <> old.id
        and r.anuncio_id = old.anuncio_id
        and r.estado in ('confirmada','em_utilizacao')
        and r.inicio < new.fim
        and r.fim > old.fim
    ) into overlap_exists;

    if overlap_exists then
      raise exception 'A viatura já está reservada no período adicional';
    end if;
  elsif new.total <> old.total then
    raise exception 'O valor da reserva só pode mudar ao estender o período';
  end if;

  if new.avaliacao is distinct from old.avaliacao then
    if old.estado <> 'concluida' then
      raise exception 'Só pode avaliar reservas concluídas';
    end if;

    if old.avaliacao is not null then
      raise exception 'Esta reserva já foi avaliada';
    end if;

    if new.avaliacao is null or new.avaliacao < 1 or new.avaliacao > 5 then
      raise exception 'A avaliação deve estar entre 1 e 5';
    end if;
  end if;

  if new.comentario is distinct from old.comentario
     and char_length(coalesce(new.comentario, '')) > 1000 then
    raise exception 'O comentário é demasiado longo';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reservas_validar on public.reservas;
create trigger reservas_validar
before insert or update on public.reservas
for each row execute function public.validar_reserva();
