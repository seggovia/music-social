-- A MusicBrainz release identifies one physical/digital edition. The release
-- group identifies the conceptual album shared by all of those editions.

ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS release_group_id TEXT;

-- NULL keeps legacy rows valid. The unique partial index makes the
-- check-before-insert flow race-safe for every album identified going forward.
CREATE UNIQUE INDEX IF NOT EXISTS idx_albums_release_group_id
  ON public.albums(release_group_id)
  WHERE release_group_id IS NOT NULL;

COMMENT ON COLUMN public.albums.release_group_id IS
  'MusicBrainz release-group MBID used as the conceptual album cache key.';
