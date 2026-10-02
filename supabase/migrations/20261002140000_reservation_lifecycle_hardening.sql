-- Harden the customer reservation lifecycle: ownership, availability, safe cancellation/extension/rating.
create index if not exists reservas_anuncio_periodo_idx
  on public.reservas (anuncio_id, inicio, fim);

create or replace function public.validar_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean := private.has_role(auth.uid(), 'admin'::public.app_role);
  actor_is_provider boolean := auth.uid() = old.fornecedor_id;
  overlap_exists boolean;
  old_seconds numeric;
  delta_seconds numeric;
  expected_total numeric;
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

    select a.owner_id, a.estado, a.disponivel
      into new.fornecedor_id, new.estado, new.extras
      from public.anuncios a
      where a.id = new.anuncio_id
      for share;

    if not found then
      raise exception 'Anúncio não encontrado';
    end if;

    if new.estado <> 'pendente' then
      raise exception 'Uma nova reserva deve começar como pendente';
    end if;

    if new.fornecedor_id is null or new.fornecedor_id = new.cliente_id then
      raise exception 'O anúncio não pode ser reservado pelo próprio proprietário';
    end if;

    if (select estado from public.anuncios where id = new.anuncio_id) <> 'aprovado'
       or not (select disponivel from public.anuncios where id = new.anuncio_id) then
      raise exception 'Este anúncio não está disponível para reserva';
    end if;

    -- Keep the caller's extras; the SELECT above only supplies ownership/state checks.
    new.extras := coalesce((select r.extras from public.reservas r where false), new.extras);

    -- Serialize checks per vehicle so two simultaneous confirmations cannot overlap.
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

  -- Immutable identity and financial source fields for non-admin users.
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
    if new.total <> old.total or new.fim <> old.fim or new.avaliacao is distinct from old.avaliacao
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
        select 1 from public.reservas r
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

  -- Customer may cancel pending/confirmed reservations.
  if new.estado <> old.estado then
    if not (new.estado = 'cancelada' and old.estado in ('pendente','confirmada')) then
      raise exception 'Só pode cancelar reservas pendentes ou confirmadas';
    end if;
  end if;

  -- Customer may extend an active reservation. The price must remain proportional
  -- to the original duration; the client cannot choose an arbitrary total.
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
      select 1 from public.reservas r
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

-- The reservation trigger now derives supplier ownership from the ad, so clients
-- cannot spoof a different supplier.
