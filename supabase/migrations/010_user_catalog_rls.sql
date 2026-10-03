-- Catalogs are public to read, while each authenticated user can only mutate
-- their own entries.
ALTER TABLE public.user_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User catalogs are publicly readable" ON public.user_catalog;
CREATE POLICY "User catalogs are publicly readable"
  ON public.user_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create catalog entries" ON public.user_catalog;
CREATE POLICY "Authenticated users can create catalog entries"
  ON public.user_catalog
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own catalog entries" ON public.user_catalog;
CREATE POLICY "Users can update their own catalog entries"
  ON public.user_catalog
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own catalog entries" ON public.user_catalog;
CREATE POLICY "Users can delete their own catalog entries"
  ON public.user_catalog
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_user_catalog_user_status_created_at
  ON public.user_catalog(user_id, status, created_at DESC);
