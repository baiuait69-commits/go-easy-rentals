CREATE TYPE public.anuncio_categoria AS ENUM ('veiculos','transporte','pesados','maquinas','servicos');
CREATE TYPE public.anuncio_estado AS ENUM ('rascunho','pendente','aprovado','rejeitado','bloqueado');
CREATE TYPE public.tipo_conta AS ENUM ('cliente','proprietario','empresa');

CREATE TABLE public.perfis (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  telefone text,
  municipio text,
  tipo_conta public.tipo_conta NOT NULL DEFAULT 'cliente',
  verificado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver o proprio perfil" ON public.perfis FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Criar o proprio perfil" ON public.perfis FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Editar o proprio perfil" ON public.perfis FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.anuncios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria public.anuncio_categoria NOT NULL,
  subcategoria text NOT NULL,
  titulo text NOT NULL,
  marca text,
  modelo text,
  ano integer,
  descricao text,
  municipio text NOT NULL,
  preco_hora numeric(12,2),
  preco_dia numeric(12,2) NOT NULL,
  preco_semana numeric(12,2),
  preco_mes numeric(12,2),
  caucao numeric(12,2) NOT NULL DEFAULT 0,
  carga_m3 numeric(8,2),
  lugares integer,
  transmissao text,
  combustivel text,
  com_motorista boolean NOT NULL DEFAULT false,
  entrega boolean NOT NULL DEFAULT false,
  imagem text,
  disponivel boolean NOT NULL DEFAULT true,
  destaque boolean NOT NULL DEFAULT false,
  estado public.anuncio_estado NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anuncios TO authenticated;
GRANT SELECT ON public.anuncios TO anon;
GRANT ALL ON public.anuncios TO service_role;
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anuncios aprovados sao publicos" ON public.anuncios FOR SELECT TO anon, authenticated USING (estado = 'aprovado');
CREATE POLICY "Fornecedor ve os seus anuncios" ON public.anuncios FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Fornecedor cria anuncios" ON public.anuncios FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Fornecedor edita os seus anuncios" ON public.anuncios FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Fornecedor apaga os seus anuncios" ON public.anuncios FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

CREATE INDEX anuncios_categoria_idx ON public.anuncios (categoria, estado);
CREATE INDEX anuncios_municipio_idx ON public.anuncios (municipio);

CREATE TABLE public.anuncio_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anuncio_id uuid NOT NULL REFERENCES public.anuncios(id) ON DELETE CASCADE,
  url text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anuncio_fotos TO authenticated;
GRANT SELECT ON public.anuncio_fotos TO anon;
GRANT ALL ON public.anuncio_fotos TO service_role;
ALTER TABLE public.anuncio_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fotos de anuncios aprovados sao publicas" ON public.anuncio_fotos FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.anuncios a WHERE a.id = anuncio_id AND a.estado = 'aprovado'));
CREATE POLICY "Fornecedor gere as fotos dos seus anuncios" ON public.anuncio_fotos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.anuncios a WHERE a.id = anuncio_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')))) WITH CHECK (EXISTS (SELECT 1 FROM public.anuncios a WHERE a.id = anuncio_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER anuncios_updated_at BEFORE UPDATE ON public.anuncios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER perfis_updated_at BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfis (id, nome) VALUES (NEW.id, NEW.raw_user_meta_data->>'nome')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();