-- 1. Gateway credentials: remove public read access
DROP POLICY IF EXISTS "public can read active gateway name" ON public.gateways;
REVOKE ALL ON public.gateways FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gateways TO authenticated;
GRANT ALL ON public.gateways TO service_role;

-- 2. Orders: remove anonymous update path (checkout writes run server-side)
DROP POLICY IF EXISTS "public can update checkout order status" ON public.orders;
REVOKE UPDATE ON public.orders FROM anon;
REVOKE UPDATE ON public.orders FROM authenticated;
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- 3. Receipts storage: no anonymous uploads, admin-only read/delete
DROP POLICY IF EXISTS "anon can upload receipts" ON storage.objects;

CREATE POLICY "admins read receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. SECURITY DEFINER functions: only reachable from trusted server code
REVOKE EXECUTE ON FUNCTION public.get_order_status(p_transaction_id text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.upsert_page_view(p_session_id text, p_path text, p_title text, p_referrer text, p_ip text, p_user_agent text, p_country text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.insert_page_view_event(p_session_id text, p_event text, p_path text, p_meta jsonb, p_ip text, p_user_agent text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.insert_visit_log(p_session_id text, p_path text, p_referrer text, p_ip text, p_user_agent text, p_country text, p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_content text, p_utm_term text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated;