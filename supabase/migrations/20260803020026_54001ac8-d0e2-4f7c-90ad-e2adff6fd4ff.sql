CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_email text,
  target_user_id uuid NOT NULL,
  target_email text,
  role app_role NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_audit_log TO authenticated;
GRANT ALL ON public.role_audit_log TO service_role;

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestores veem o registo de auditoria"
ON public.role_audit_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX role_audit_log_created_at_idx ON public.role_audit_log (created_at DESC);