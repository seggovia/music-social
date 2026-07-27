-- Review comments are public to read, but only authenticated users can create
-- rows for themselves or delete their own rows.
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Review comments are publicly readable" ON public.review_comments;
CREATE POLICY "Review comments are publicly readable"
  ON public.review_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create review comments" ON public.review_comments;
CREATE POLICY "Authenticated users can create review comments"
  ON public.review_comments
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own review comments" ON public.review_comments;
CREATE POLICY "Users can delete their own review comments"
  ON public.review_comments
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_review_comments_review_created_at
  ON public.review_comments(review_id, created_at, id);
