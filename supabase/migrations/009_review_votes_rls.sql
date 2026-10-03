-- Review vote totals are public. Creating, changing, or removing a vote is
-- limited to the authenticated user who owns that vote.
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Review votes are publicly readable" ON public.review_votes;
CREATE POLICY "Review votes are publicly readable"
  ON public.review_votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create review votes" ON public.review_votes;
CREATE POLICY "Authenticated users can create review votes"
  ON public.review_votes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own review votes" ON public.review_votes;
CREATE POLICY "Users can update their own review votes"
  ON public.review_votes
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own review votes" ON public.review_votes;
CREATE POLICY "Users can delete their own review votes"
  ON public.review_votes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_value
  ON public.review_votes(review_id, value);
