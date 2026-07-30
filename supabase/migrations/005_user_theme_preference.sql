-- Persist each user's selected visual theme.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'light';

DO $$
BEGIN
  ALTER TABLE public.users
    ADD CONSTRAINT users_theme_preference_check
    CHECK (theme_preference IN ('light', 'dark'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
