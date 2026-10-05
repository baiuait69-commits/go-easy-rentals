CREATE TYPE public.kyc_estado AS ENUM ('nao_iniciado','pendente','aprovado','rejeitado');
CREATE TYPE public.pagamento_estado AS ENUM ('pendente','pago_retido','entregue','recebido','liberado','reembolsado');

CREATE OR REPLACE FUNCTION private.is_gestor(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.has_role(_uid,'admin') OR private.has_role(_uid,'suporte') $$;

-- Verificação de identidade (cliente)
CREATE TABLE public.verificacoes (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  nome_completo text, data_nascimento date, morada text, contacto_emergencia text,
  telefone text, telefone_verificado boolean NOT NULL DEFAULT false,
  doc_tipo text NOT NULL DEFAULT 'BI', doc_numero text, doc_frente text, doc_verso text, selfie text,
  pagamento_validado boolean NOT NULL DEFAULT false,
  estado public.kyc_estado NOT NULL DEFAULT 'nao_iniciado', motivo text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.verificacoes TO authenticated;
GRANT ALL ON public.verificacoes TO service_role;
ALTER TABLE public.verificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver verificacao" ON public.verificacoes FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.is_gestor(auth.uid()));
CREATE POLICY "Criar verificacao" ON public.verificacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Editar verificacao" ON public.verificacoes FOR UPDATE TO authenticated USING (auth.uid() = user_id OR private.is_gestor(auth.uid())) WITH CHECK (auth.uid() = user_id OR private.is_gestor(auth.uid()));

-- KYC fornecedor
CREATE TABLE public.kyc_fornecedor (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  tipo text NOT NULL DEFAULT 'singular' CHECK (tipo IN ('singular','empresa')),
  nif text, banco text, iban text, titular_conta text,
  denominacao text, certidao text, alvara text, representante text, representante_bi text, contacto_empresa text, endereco text,
  estado public.kyc_estado NOT NULL DEFAULT 'nao_iniciado', motivo text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.kyc_fornecedor TO authenticated;
GRANT ALL ON public.kyc_fornecedor TO service_role;
ALTER TABLE public.kyc_fornecedor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver kyc" ON public.kyc_fornecedor FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.is_gestor(auth.uid()));
CREATE POLICY "Criar kyc" ON public.kyc_fornecedor FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Editar kyc" ON public.kyc_fornecedor FOR UPDATE TO authenticated USING (auth.uid() = user_id OR private.is_gestor(auth.uid())) WITH CHECK (auth.uid() = user_id OR private.is_gestor(auth.uid()));

-- Alertas
CREATE TABLE public.alertas_fraude (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, tipo text NOT NULL, descricao text NOT NULL, referencia text,
  gravidade text NOT NULL DEFAULT 'media' CHECK (gravidade IN ('baixa','media','alta')),
  resolvido boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.alertas_fraude TO authenticated;
GRANT ALL ON public.alertas_fraude TO service_role;
ALTER TABLE public.alertas_fraude ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestores veem alertas" ON public.alertas_fraude FOR SELECT TO authenticated USING (private.is_gestor(auth.uid()));
CREATE POLICY "Gestores resolvem alertas" ON public.alertas_fraude FOR UPDATE TO authenticated USING (private.is_gestor(auth.uid())) WITH CHECK (private.is_gestor(auth.uid()));

-- Histórico
CREATE TABLE public.historico_alteracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, autor_id uuid DEFAULT auth.uid(), tabela text NOT NULL, campo text NOT NULL,
  antigo text, novo text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.historico_alteracoes TO authenticated;
GRANT ALL ON public.historico_alteracoes TO service_role;
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver historico" ON public.historico_alteracoes FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.is_gestor(auth.uid()));

-- Anúncios: titularidade e identificação do bem
ALTER TABLE public.anuncios
  ADD COLUMN e_proprietario boolean NOT NULL DEFAULT true,
  ADD COLUMN qualidade_titular text,
  ADD COLUMN doc_titularidade text,
  ADD COLUMN matricula text, ADD COLUMN vin text, ADD COLUMN numero_serie text,
  ADD COLUMN quilometragem integer, ADD COLUMN horas_uso integer,
  ADD COLUMN doc_seguro text, ADD COLUMN doc_inspecao text,
  ADD COLUMN operador_incluido boolean NOT NULL DEFAULT false, ADD COLUMN condicoes text,
  ADD COLUMN fotos_verificacao jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN codigo_verificacao text,
  ADD COLUMN bem_verificado boolean NOT NULL DEFAULT false;
CREATE INDEX anuncios_vin_idx ON public.anuncios (upper(vin));
CREATE INDEX anuncios_matricula_idx ON public.anuncios (upper(matricula));
CREATE INDEX anuncios_serie_idx ON public.anuncios (upper(numero_serie));

-- Reservas: risco e pagamento retido
ALTER TABLE public.reservas
  ADD COLUMN risco text NOT NULL DEFAULT 'baixo',
  ADD COLUMN em_analise boolean NOT NULL DEFAULT false,
  ADD COLUMN estado_pagamento public.pagamento_estado NOT NULL DEFAULT 'pendente',
  ADD COLUMN referencia_pagamento text DEFAULT lpad((floor(random()*1e9))::bigint::text, 9, '0');

-- Detecção de frases suspeitas
CREATE OR REPLACE FUNCTION private.texto_suspeito(t text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(t,'') ~* '(whats ?app|zap|transfer[eê]ncia|manda (para|pra) (esta|a minha) conta|fora da (plataforma|aplica)|n[aã]o precisa pagar pela|mais barato fora|\+?244 ?9\d{2} ?\d{3} ?\d{3}|\m9\d{8}\M|iban)' $$;

-- Trigger verificações
CREATE OR REPLACE FUNCTION public.trg_verificacoes() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gestor boolean := private.is_gestor(auth.uid()); dup int;
BEGIN
  IF NOT gestor THEN
    IF TG_OP = 'INSERT' THEN
      NEW.estado := CASE WHEN NEW.doc_numero IS NOT NULL THEN 'pendente' ELSE 'nao_iniciado' END;
      NEW.telefone_verificado := false; NEW.pagamento_validado := false; NEW.motivo := NULL;
    ELSE
      NEW.telefone_verificado := CASE WHEN NEW.telefone IS DISTINCT FROM OLD.telefone THEN false ELSE OLD.telefone_verificado END;
      NEW.pagamento_validado := OLD.pagamento_validado;
      IF NEW.doc_numero IS DISTINCT FROM OLD.doc_numero OR NEW.doc_frente IS DISTINCT FROM OLD.doc_frente
         OR NEW.nome_completo IS DISTINCT FROM OLD.nome_completo OR NEW.selfie IS DISTINCT FROM OLD.selfie
         OR NEW.data_nascimento IS DISTINCT FROM OLD.data_nascimento OR NEW.estado IS DISTINCT FROM OLD.estado THEN
        NEW.estado := CASE WHEN NEW.doc_numero IS NOT NULL THEN 'pendente' ELSE 'nao_iniciado' END; NEW.motivo := NULL;
      ELSE NEW.estado := OLD.estado; NEW.motivo := OLD.motivo; END IF;
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.doc_numero IS DISTINCT FROM OLD.doc_numero THEN INSERT INTO historico_alteracoes(user_id,tabela,campo,antigo,novo) VALUES (NEW.user_id,'verificacoes','doc_numero',OLD.doc_numero,NEW.doc_numero); END IF;
    IF NEW.nome_completo IS DISTINCT FROM OLD.nome_completo THEN INSERT INTO historico_alteracoes(user_id,tabela,campo,antigo,novo) VALUES (NEW.user_id,'verificacoes','nome_completo',OLD.nome_completo,NEW.nome_completo); END IF;
    IF NEW.telefone IS DISTINCT FROM OLD.telefone THEN INSERT INTO historico_alteracoes(user_id,tabela,campo,antigo,novo) VALUES (NEW.user_id,'verificacoes','telefone',OLD.telefone,NEW.telefone); END IF;
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN INSERT INTO historico_alteracoes(user_id,tabela,campo,antigo,novo) VALUES (NEW.user_id,'verificacoes','estado',OLD.estado::text,NEW.estado::text); END IF;
  END IF;
  IF NEW.doc_numero IS NOT NULL AND (TG_OP='INSERT' OR NEW.doc_numero IS DISTINCT FROM OLD.doc_numero) THEN
    SELECT count(*) INTO dup FROM verificacoes WHERE upper(doc_numero)=upper(NEW.doc_numero) AND user_id<>NEW.user_id;
    IF dup > 0 THEN INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (NEW.user_id,'conta_duplicada','Documento '||NEW.doc_numero||' já usado noutra conta',NEW.doc_numero,'alta'); END IF;
  END IF;
  IF NEW.telefone IS NOT NULL AND (TG_OP='INSERT' OR NEW.telefone IS DISTINCT FROM OLD.telefone) THEN
    SELECT count(*) INTO dup FROM verificacoes WHERE regexp_replace(telefone,'\D','','g')=regexp_replace(NEW.telefone,'\D','','g') AND user_id<>NEW.user_id;
    IF dup > 0 THEN INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (NEW.user_id,'conta_duplicada','Telefone já usado noutra conta',NEW.telefone,'media'); END IF;
  END IF;
  NEW.updated_at := now(); RETURN NEW;
END $$;
CREATE TRIGGER verificacoes_validar BEFORE INSERT OR UPDATE ON public.verificacoes FOR EACH ROW EXECUTE FUNCTION public.trg_verificacoes();

-- Trigger KYC fornecedor
CREATE OR REPLACE FUNCTION public.trg_kyc_fornecedor() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gestor boolean := private.is_gestor(auth.uid()); dup int;
BEGIN
  IF NOT gestor THEN
    IF TG_OP = 'INSERT' THEN NEW.estado := CASE WHEN NEW.nif IS NOT NULL AND NEW.iban IS NOT NULL THEN 'pendente' ELSE 'nao_iniciado' END; NEW.motivo := NULL;
    ELSE
      IF NEW.iban IS DISTINCT FROM OLD.iban OR NEW.nif IS DISTINCT FROM OLD.nif OR NEW.titular_conta IS DISTINCT FROM OLD.titular_conta
         OR NEW.denominacao IS DISTINCT FROM OLD.denominacao OR NEW.representante_bi IS DISTINCT FROM OLD.representante_bi OR NEW.estado IS DISTINCT FROM OLD.estado
         OR NEW.tipo IS DISTINCT FROM OLD.tipo OR NEW.certidao IS DISTINCT FROM OLD.certidao THEN
        NEW.estado := CASE WHEN NEW.nif IS NOT NULL AND NEW.iban IS NOT NULL THEN 'pendente' ELSE 'nao_iniciado' END; NEW.motivo := NULL;
      ELSE NEW.estado := OLD.estado; NEW.motivo := OLD.motivo; END IF;
    END IF;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.iban IS DISTINCT FROM OLD.iban THEN INSERT INTO historico_alteracoes(user_id,tabela,campo,antigo,novo) VALUES (NEW.user_id,'kyc_fornecedor','iban',OLD.iban,NEW.iban); END IF;
    IF NEW.nif IS DISTINCT FROM OLD.nif THEN INSERT INTO historico_alteracoes(user_id,tabela,campo,antigo,novo) VALUES (NEW.user_id,'kyc_fornecedor','nif',OLD.nif,NEW.nif); END IF;
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN INSERT INTO historico_alteracoes(user_id,tabela,campo,antigo,novo) VALUES (NEW.user_id,'kyc_fornecedor','estado',OLD.estado::text,NEW.estado::text); END IF;
  END IF;
  IF NEW.iban IS NOT NULL AND (TG_OP='INSERT' OR NEW.iban IS DISTINCT FROM OLD.iban) THEN
    SELECT count(*) INTO dup FROM kyc_fornecedor WHERE replace(upper(iban),' ','')=replace(upper(NEW.iban),' ','') AND user_id<>NEW.user_id;
    IF dup > 0 THEN INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (NEW.user_id,'conta_duplicada','IBAN já usado noutra conta',NEW.iban,'alta'); END IF;
  END IF;
  NEW.updated_at := now(); RETURN NEW;
END $$;
CREATE TRIGGER kyc_fornecedor_validar BEFORE INSERT OR UPDATE ON public.kyc_fornecedor FOR EACH ROW EXECUTE FUNCTION public.trg_kyc_fornecedor();

-- Trigger anúncios
CREATE OR REPLACE FUNCTION public.trg_anuncios_antifraude() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gestor boolean := private.is_gestor(auth.uid()); dup int; kyc public.kyc_estado;
BEGIN
  IF NOT gestor THEN
    SELECT estado INTO kyc FROM kyc_fornecedor WHERE user_id = NEW.owner_id;
    IF TG_OP='INSERT' AND coalesce(kyc,'nao_iniciado') <> 'aprovado' THEN
      RAISE EXCEPTION 'Complete e aguarde a aprovação da verificação de fornecedor antes de publicar anúncios';
    END IF;
    IF TG_OP='INSERT' THEN
      NEW.bem_verificado := false;
      IF NEW.estado NOT IN ('rascunho','pendente') THEN NEW.estado := 'pendente'; END IF;
    ELSE
      NEW.bem_verificado := CASE WHEN NEW.vin IS DISTINCT FROM OLD.vin OR NEW.matricula IS DISTINCT FROM OLD.matricula OR NEW.numero_serie IS DISTINCT FROM OLD.numero_serie OR NEW.doc_titularidade IS DISTINCT FROM OLD.doc_titularidade THEN false ELSE OLD.bem_verificado END;
      IF NEW.estado IS DISTINCT FROM OLD.estado AND NEW.estado NOT IN ('rascunho','pendente') THEN NEW.estado := OLD.estado; END IF;
      IF NEW.bem_verificado IS DISTINCT FROM OLD.bem_verificado AND OLD.estado='aprovado' THEN NEW.estado := 'pendente'; END IF;
      IF NEW.destaque IS DISTINCT FROM OLD.destaque THEN NEW.destaque := OLD.destaque; END IF;
    END IF;
  END IF;
  IF coalesce(NEW.vin,'') <> '' THEN
    SELECT count(*) INTO dup FROM anuncios WHERE upper(vin)=upper(NEW.vin) AND owner_id<>NEW.owner_id;
    IF dup > 0 THEN NEW.estado := CASE WHEN NEW.estado='aprovado' AND NOT gestor THEN 'pendente' ELSE NEW.estado END;
      INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (NEW.owner_id,'bem_duplicado','VIN/chassis '||NEW.vin||' registado por outra conta',NEW.vin,'alta'); END IF;
  END IF;
  IF coalesce(NEW.matricula,'') <> '' THEN
    SELECT count(*) INTO dup FROM anuncios WHERE upper(replace(matricula,'-',''))=upper(replace(NEW.matricula,'-','')) AND owner_id<>NEW.owner_id;
    IF dup > 0 THEN INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (NEW.owner_id,'bem_duplicado','Matrícula '||NEW.matricula||' registada por outra conta',NEW.matricula,'alta'); END IF;
  END IF;
  IF coalesce(NEW.numero_serie,'') <> '' THEN
    SELECT count(*) INTO dup FROM anuncios WHERE upper(numero_serie)=upper(NEW.numero_serie) AND owner_id<>NEW.owner_id;
    IF dup > 0 THEN INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (NEW.owner_id,'bem_duplicado','Nº de série '||NEW.numero_serie||' registado por outra conta',NEW.numero_serie,'alta'); END IF;
  END IF;
  IF private.texto_suspeito(NEW.descricao) AND (TG_OP='INSERT' OR NEW.descricao IS DISTINCT FROM OLD.descricao) THEN
    INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (NEW.owner_id,'pagamento_externo','Descrição do anúncio "'||NEW.titulo||'" sugere contacto/pagamento fora da plataforma',NEW.id::text,'media');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER anuncios_antifraude BEFORE INSERT OR UPDATE ON public.anuncios FOR EACH ROW EXECUTE FUNCTION public.trg_anuncios_antifraude();

-- Reservas: gate KYC, risco, pagamento
CREATE OR REPLACE FUNCTION public.validar_reserva()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE is_admin boolean := private.is_gestor(auth.uid()); v public.verificacoes; idade interval; pontos int := 0; alertas int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.anuncio_id IS NOT NULL THEN
      SELECT owner_id INTO NEW.fornecedor_id FROM public.anuncios WHERE id = NEW.anuncio_id;
    ELSE NEW.fornecedor_id := NULL; END IF;
    IF NEW.inicio < now() - interval '1 hour' THEN RAISE EXCEPTION 'A data de início já passou'; END IF;
    SELECT * INTO v FROM verificacoes WHERE user_id = NEW.cliente_id;
    IF NOT is_admin AND (v.user_id IS NULL OR v.estado <> 'aprovado') THEN
      RAISE EXCEPTION 'Verifique a sua identidade antes de reservar (Perfil → Verificação)';
    END IF;
    NEW.estado_pagamento := 'pendente'; NEW.em_analise := false;
    SELECT now() - created_at INTO idade FROM perfis WHERE id = NEW.cliente_id;
    IF idade IS NULL OR idade < interval '7 days' THEN pontos := pontos + 2; END IF;
    IF NOT coalesce(v.telefone_verificado,false) THEN pontos := pontos + 1; END IF;
    IF NOT coalesce(v.pagamento_validado,false) THEN pontos := pontos + 1; END IF;
    IF NEW.total > 500000 THEN pontos := pontos + 2; ELSIF NEW.total > 150000 THEN pontos := pontos + 1; END IF;
    IF v.updated_at > now() - interval '2 days' THEN pontos := pontos + 1; END IF;
    SELECT count(*) INTO alertas FROM alertas_fraude WHERE user_id = NEW.cliente_id AND NOT resolvido;
    pontos := pontos + alertas * 2;
    NEW.risco := CASE WHEN pontos >= 6 THEN 'alto' WHEN pontos >= 3 THEN 'medio' ELSE 'baixo' END;
    IF NEW.risco = 'alto' THEN
      NEW.em_analise := true;
      INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (NEW.cliente_id,'reserva_alto_risco','Reserva '||NEW.numero||' bloqueada para análise manual',NEW.numero,'alta');
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.cliente_id <> OLD.cliente_id OR NEW.fornecedor_id IS DISTINCT FROM OLD.fornecedor_id
     OR NEW.total < 0 OR NEW.inicio <> OLD.inicio THEN RAISE EXCEPTION 'Alteração não permitida'; END IF;
  IF private.texto_suspeito(NEW.comentario) AND NEW.comentario IS DISTINCT FROM OLD.comentario THEN
    INSERT INTO alertas_fraude(user_id,tipo,descricao,referencia,gravidade) VALUES (auth.uid(),'pagamento_externo','Comentário na reserva '||NEW.numero||' sugere negociação fora da plataforma',NEW.numero,'media');
  END IF;
  IF is_admin THEN NEW.updated_at := now(); RETURN NEW; END IF;
  NEW.risco := OLD.risco; NEW.em_analise := OLD.em_analise; NEW.referencia_pagamento := OLD.referencia_pagamento;
  IF auth.uid() = OLD.fornecedor_id THEN
    IF OLD.em_analise AND NEW.estado <> OLD.estado AND NEW.estado <> 'rejeitada' THEN RAISE EXCEPTION 'Reserva em análise antifraude'; END IF;
    IF NEW.estado IN ('confirmada','em_utilizacao') AND NEW.estado <> OLD.estado AND OLD.estado_pagamento = 'pendente' THEN
      RAISE EXCEPTION 'Aguarde a confirmação do pagamento pela plataforma'; END IF;
    IF NEW.estado_pagamento <> OLD.estado_pagamento AND NOT (OLD.estado_pagamento='pago_retido' AND NEW.estado_pagamento='entregue') THEN
      RAISE EXCEPTION 'Só pode marcar o bem como entregue'; END IF;
    NEW.updated_at := now(); RETURN NEW;
  END IF;
  -- cliente
  IF NEW.estado_pagamento <> OLD.estado_pagamento AND NOT (OLD.estado_pagamento='entregue' AND NEW.estado_pagamento='recebido') THEN
    RAISE EXCEPTION 'Só pode confirmar a recepção do bem'; END IF;
  IF NEW.estado <> OLD.estado AND NOT (NEW.estado = 'cancelada' AND OLD.estado IN ('pendente','confirmada')) THEN
    RAISE EXCEPTION 'Só pode cancelar reservas pendentes ou confirmadas'; END IF;
  IF NEW.avaliacao IS DISTINCT FROM OLD.avaliacao AND OLD.estado <> 'concluida' THEN
    RAISE EXCEPTION 'Só pode avaliar reservas concluídas'; END IF;
  IF NEW.fim <> OLD.fim AND (OLD.estado NOT IN ('confirmada','em_utilizacao') OR NEW.fim < OLD.fim) THEN
    RAISE EXCEPTION 'Só pode estender reservas activas'; END IF;
  IF NEW.total <> OLD.total AND NEW.fim = OLD.fim THEN RAISE EXCEPTION 'Alteração não permitida'; END IF;
  NEW.updated_at := now(); RETURN NEW;
END $function$;

-- Reputação pública do fornecedor
CREATE OR REPLACE FUNCTION public.reputacao_fornecedor(_uid uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'identidade', coalesce((SELECT estado='aprovado' FROM verificacoes WHERE user_id=_uid), false),
    'telefone', coalesce((SELECT telefone_verificado FROM verificacoes WHERE user_id=_uid), false),
    'documentacao', coalesce((SELECT estado='aprovado' FROM kyc_fornecedor WHERE user_id=_uid), false),
    'bens_verificados', (SELECT count(*) FROM anuncios WHERE owner_id=_uid AND bem_verificado),
    'concluidas', (SELECT count(*) FROM reservas WHERE fornecedor_id=_uid AND estado='concluida'),
    'finalizadas', (SELECT count(*) FROM reservas WHERE fornecedor_id=_uid AND estado IN ('concluida','cancelada','rejeitada')),
    'avaliacao', (SELECT round(avg(avaliacao)::numeric,1) FROM reservas WHERE fornecedor_id=_uid AND avaliacao IS NOT NULL),
    'desde', (SELECT created_at FROM perfis WHERE id=_uid)) $$;
GRANT EXECUTE ON FUNCTION public.reputacao_fornecedor(uuid) TO anon, authenticated;

-- Storage: documentos privados, pasta = user id
CREATE POLICY "kyc dono envia" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='kyc' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "kyc dono ou gestor ve" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='kyc' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.is_gestor(auth.uid())));
CREATE POLICY "kyc dono actualiza" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='kyc' AND (storage.foldername(name))[1] = auth.uid()::text);