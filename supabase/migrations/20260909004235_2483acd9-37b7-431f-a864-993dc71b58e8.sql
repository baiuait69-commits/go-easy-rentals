CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, PUBLIC;

DROP POLICY IF EXISTS "Gestores gerem funcoes" ON public.user_roles;
DROP POLICY IF EXISTS "Gestores veem todas as funcoes" ON public.user_roles;

DROP POLICY IF EXISTS "Editar o proprio perfil" ON public.perfis;
CREATE POLICY "Editar o proprio perfil"
ON public.perfis FOR UPDATE TO authenticated
USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Ver o proprio perfil" ON public.perfis;
CREATE POLICY "Ver o proprio perfil"
ON public.perfis FOR SELECT TO authenticated
USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Fornecedor apaga os seus anuncios" ON public.anuncios;
CREATE POLICY "Fornecedor apaga os seus anuncios"
ON public.anuncios FOR DELETE TO authenticated
USING ((auth.uid() = owner_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Fornecedor edita os seus anuncios" ON public.anuncios;
CREATE POLICY "Fornecedor edita os seus anuncios"
ON public.anuncios FOR UPDATE TO authenticated
USING ((auth.uid() = owner_id) OR private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK ((auth.uid() = owner_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Fornecedor ve os seus anuncios" ON public.anuncios;
CREATE POLICY "Fornecedor ve os seus anuncios"
ON public.anuncios FOR SELECT TO authenticated
USING ((auth.uid() = owner_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Fornecedor gere as fotos dos seus anuncios" ON public.anuncio_fotos;
CREATE POLICY "Fornecedor gere as fotos dos seus anuncios"
ON public.anuncio_fotos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.anuncios a WHERE a.id = anuncio_fotos.anuncio_id AND (a.owner_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))))
WITH CHECK (EXISTS (SELECT 1 FROM public.anuncios a WHERE a.id = anuncio_fotos.anuncio_id AND (a.owner_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))));

DROP POLICY IF EXISTS "Gestores veem o registo de auditoria" ON public.role_audit_log;
CREATE POLICY "Gestores veem o registo de auditoria"
ON public.role_audit_log FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));