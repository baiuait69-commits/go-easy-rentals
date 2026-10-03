CREATE TABLE public.auth_tentativas (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  origem text not null default 'app',
  sucesso boolean not null,
  erro text,
  created_at timestamptz not null default now()
);
GRANT INSERT ON public.auth_tentativas TO anon, authenticated;
GRANT SELECT ON public.auth_tentativas TO authenticated;
GRANT ALL ON public.auth_tentativas TO service_role;
ALTER TABLE public.auth_tentativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registar tentativas" ON public.auth_tentativas FOR INSERT TO anon, authenticated
  WITH CHECK (length(email) <= 255 AND origem IN ('app','admin') AND (erro IS NULL OR length(erro) <= 500));
CREATE POLICY "Gestores veem tentativas" ON public.auth_tentativas FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin'));

CREATE TABLE public.diagnosticos_acesso (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null default auth.uid(),
  email_alvo text not null,
  descricao text not null,
  resultado jsonb not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.diagnosticos_acesso TO authenticated;
GRANT ALL ON public.diagnosticos_acesso TO service_role;
ALTER TABLE public.diagnosticos_acesso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestores veem diagnosticos" ON public.diagnosticos_acesso FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY "Gestores criam diagnosticos" ON public.diagnosticos_acesso FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'admin') AND autor_id = auth.uid());

REVOKE EXECUTE ON FUNCTION public.validar_reserva() FROM anon, authenticated, public;