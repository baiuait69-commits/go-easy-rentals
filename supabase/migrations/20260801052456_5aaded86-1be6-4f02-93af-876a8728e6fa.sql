INSERT INTO public.user_roles (user_id, role)
VALUES ('817d8327-d3b7-4ee2-974f-9c5ee9968ee4', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;