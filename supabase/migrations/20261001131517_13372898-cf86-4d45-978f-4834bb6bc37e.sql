CREATE TYPE public.reserva_estado AS ENUM ('pendente','confirmada','em_utilizacao','concluida','cancelada','rejeitada');

CREATE TABLE public.reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL DEFAULT ('TC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  cliente_id uuid NOT NULL DEFAULT auth.uid(),
  fornecedor_id uuid,
  anuncio_id uuid REFERENCES public.anuncios(id) ON DELETE SET NULL,
  item_ref text NOT NULL,
  titulo text NOT NULL,
  imagem text,
  local text,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  total numeric NOT NULL CHECK (total >= 0),
  caucao numeric NOT NULL DEFAULT 0,
  comissao numeric GENERATED ALWAYS AS (round(total * 0.15)) STORED,
  metodo_pagamento text NOT NULL,
  extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado public.reserva_estado NOT NULL DEFAULT 'pendente',
  avaliacao integer CHECK (avaliacao BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fim > inicio)
);

GRANT SELECT, INSERT, UPDATE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver reservas envolvidas" ON public.reservas FOR SELECT TO authenticated
USING (auth.uid() = cliente_id OR auth.uid() = fornecedor_id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Cliente cria reserva" ON public.reservas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = cliente_id AND estado = 'pendente' AND avaliacao IS NULL);
CREATE POLICY "Partes actualizam reserva" ON public.reservas FOR UPDATE TO authenticated
USING (auth.uid() = cliente_id OR auth.uid() = fornecedor_id OR private.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = cliente_id OR auth.uid() = fornecedor_id OR private.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.validar_reserva()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_admin boolean := private.has_role(auth.uid(),'admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.anuncio_id IS NOT NULL THEN
      SELECT owner_id INTO NEW.fornecedor_id FROM public.anuncios WHERE id = NEW.anuncio_id;
    ELSE
      NEW.fornecedor_id := NULL;
    END IF;
    IF NEW.inicio < now() - interval '1 hour' THEN RAISE EXCEPTION 'A data de início já passou'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.cliente_id <> OLD.cliente_id OR NEW.fornecedor_id IS DISTINCT FROM OLD.fornecedor_id
     OR NEW.total < 0 OR NEW.inicio <> OLD.inicio THEN
    RAISE EXCEPTION 'Alteração não permitida';
  END IF;
  IF is_admin OR auth.uid() = OLD.fornecedor_id THEN
    NEW.updated_at := now(); RETURN NEW;
  END IF;
  -- cliente
  IF NEW.estado <> OLD.estado AND NOT (NEW.estado = 'cancelada' AND OLD.estado IN ('pendente','confirmada')) THEN
    RAISE EXCEPTION 'Só pode cancelar reservas pendentes ou confirmadas';
  END IF;
  IF NEW.avaliacao IS DISTINCT FROM OLD.avaliacao AND OLD.estado <> 'concluida' THEN
    RAISE EXCEPTION 'Só pode avaliar reservas concluídas';
  END IF;
  IF NEW.fim <> OLD.fim AND (OLD.estado NOT IN ('confirmada','em_utilizacao') OR NEW.fim < OLD.fim) THEN
    RAISE EXCEPTION 'Só pode estender reservas activas';
  END IF;
  IF NEW.total <> OLD.total AND NEW.fim = OLD.fim THEN RAISE EXCEPTION 'Alteração não permitida'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER reservas_validar BEFORE INSERT OR UPDATE ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.validar_reserva();