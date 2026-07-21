-- The application contract uses `content`; older installations were created
-- from the initial migration where this column was still named `body`.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'body'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'content'
  ) THEN
    ALTER TABLE reviews RENAME COLUMN body TO content;
  END IF;
END
$$;

-- Supports the global review timeline and its "following" filter.
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
  ON reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user_created_at
  ON reviews(user_id, created_at DESC);
