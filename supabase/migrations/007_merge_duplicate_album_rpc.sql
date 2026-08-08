-- Each RPC invocation is one PostgreSQL transaction. The Node maintenance
-- script calls this function once per duplicate group.

CREATE OR REPLACE FUNCTION public.merge_duplicate_album_group(
  p_canonical_id UUID,
  p_duplicate_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expected_album_count INTEGER;
  v_found_album_count INTEGER;
  v_distinct_duplicate_count INTEGER;
  v_reachable_album_count INTEGER;
  v_release_group_count INTEGER;
  v_release_group_id TEXT;
  v_review_conflicts INTEGER;
  v_catalog_conflicts INTEGER;
  v_unexpected_fks TEXT;
  v_reviews INTEGER;
  v_album_genres INTEGER;
  v_album_comments INTEGER;
  v_user_catalog INTEGER;
  v_updated INTEGER;
  v_deleted INTEGER;
BEGIN
  IF p_canonical_id IS NULL THEN
    RAISE EXCEPTION 'canonical album id is required';
  END IF;

  IF p_duplicate_ids IS NULL OR cardinality(p_duplicate_ids) = 0 THEN
    RAISE EXCEPTION 'at least one duplicate album id is required';
  END IF;

  IF p_canonical_id = ANY(p_duplicate_ids) THEN
    RAISE EXCEPTION 'canonical album cannot also be a duplicate';
  END IF;

  SELECT count(DISTINCT duplicate_id)
  INTO v_distinct_duplicate_count
  FROM unnest(p_duplicate_ids) AS duplicate_id;

  IF v_distinct_duplicate_count <> cardinality(p_duplicate_ids) THEN
    RAISE EXCEPTION 'duplicate album ids must be unique';
  END IF;

  v_expected_album_count := cardinality(p_duplicate_ids) + 1;

  -- Lock in deterministic order so concurrent maintenance runs cannot change
  -- the group while its references are being moved.
  PERFORM a.id
  FROM public.albums a
  WHERE a.id = p_canonical_id OR a.id = ANY(p_duplicate_ids)
  ORDER BY a.id
  FOR UPDATE;

  SELECT count(*)
  INTO v_found_album_count
  FROM public.albums a
  WHERE a.id = p_canonical_id OR a.id = ANY(p_duplicate_ids);

  IF v_found_album_count <> v_expected_album_count THEN
    RAISE EXCEPTION 'expected % albums but found %', v_expected_album_count, v_found_album_count;
  END IF;

  -- Reject unknown direct references. This prevents ON DELETE CASCADE from
  -- silently deleting data if the schema gains a new albums.id foreign key.
  SELECT string_agg(
    format('%I.%I(%I)', child_namespace.nspname, child_table.relname, child_column.attname),
    ', '
    ORDER BY child_namespace.nspname, child_table.relname, child_column.attname
  )
  INTO v_unexpected_fks
  FROM pg_constraint fk
  JOIN pg_class child_table ON child_table.oid = fk.conrelid
  JOIN pg_namespace child_namespace ON child_namespace.oid = child_table.relnamespace
  JOIN pg_attribute child_column
    ON child_column.attrelid = fk.conrelid
   AND child_column.attnum = fk.conkey[1]
  WHERE fk.contype = 'f'
    AND fk.confrelid = 'public.albums'::regclass
    AND NOT (
      child_namespace.nspname = 'public'
      AND child_table.relname = ANY(ARRAY['reviews', 'album_genres', 'album_comments', 'user_catalog'])
      AND array_length(fk.conkey, 1) = 1
      AND child_column.attname = 'album_id'
    );

  IF v_unexpected_fks IS NOT NULL THEN
    RAISE EXCEPTION 'unhandled foreign keys referencing albums.id: %', v_unexpected_fks;
  END IF;

  -- Verify the supplied rows form one connected duplicate group under the
  -- same rules used by the dry-run: normalized title+artist or release group.
  WITH RECURSIVE selected_albums AS (
    SELECT
      a.id,
      a.artist_id,
      lower(regexp_replace(btrim(a.title), '\s+', ' ', 'g')) AS normalized_title,
      a.release_group_id
    FROM public.albums a
    WHERE a.id = p_canonical_id OR a.id = ANY(p_duplicate_ids)
  ),
  reachable AS (
    SELECT selected.*
    FROM selected_albums selected
    WHERE selected.id = p_canonical_id

    UNION

    SELECT candidate.*
    FROM reachable current_album
    JOIN selected_albums candidate
      ON (
        candidate.artist_id = current_album.artist_id
        AND candidate.normalized_title = current_album.normalized_title
      ) OR (
        candidate.release_group_id IS NOT NULL
        AND candidate.release_group_id = current_album.release_group_id
      )
  )
  SELECT count(*)
  INTO v_reachable_album_count
  FROM reachable;

  IF v_reachable_album_count <> v_expected_album_count THEN
    RAISE EXCEPTION 'the supplied albums do not form one connected duplicate group';
  END IF;

  SELECT count(DISTINCT a.release_group_id), min(a.release_group_id)
  INTO v_release_group_count, v_release_group_id
  FROM public.albums a
  WHERE (a.id = p_canonical_id OR a.id = ANY(p_duplicate_ids))
    AND a.release_group_id IS NOT NULL;

  IF v_release_group_count > 1 THEN
    RAISE EXCEPTION 'group contains multiple release_group_id values and requires manual review';
  END IF;

  SELECT count(*)
  INTO v_review_conflicts
  FROM (
    SELECT r.user_id
    FROM public.reviews r
    WHERE r.album_id = p_canonical_id OR r.album_id = ANY(p_duplicate_ids)
    GROUP BY r.user_id
    HAVING count(*) > 1
  ) conflicts;

  IF v_review_conflicts > 0 THEN
    RAISE EXCEPTION 'group has % users with multiple reviews; manual review merge required', v_review_conflicts;
  END IF;

  SELECT count(*)
  INTO v_catalog_conflicts
  FROM (
    SELECT catalog.user_id
    FROM public.user_catalog catalog
    WHERE catalog.album_id = p_canonical_id OR catalog.album_id = ANY(p_duplicate_ids)
    GROUP BY catalog.user_id
    HAVING count(*) > 1
  ) conflicts;

  IF v_catalog_conflicts > 0 THEN
    RAISE EXCEPTION 'group has % users with multiple catalog entries; manual resolution required', v_catalog_conflicts;
  END IF;

  SELECT count(*) INTO v_reviews
  FROM public.reviews WHERE album_id = ANY(p_duplicate_ids);

  SELECT count(*) INTO v_album_genres
  FROM public.album_genres WHERE album_id = ANY(p_duplicate_ids);

  SELECT count(*) INTO v_album_comments
  FROM public.album_comments WHERE album_id = ANY(p_duplicate_ids);

  SELECT count(*) INTO v_user_catalog
  FROM public.user_catalog WHERE album_id = ANY(p_duplicate_ids);

  UPDATE public.reviews
  SET album_id = p_canonical_id
  WHERE album_id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> v_reviews THEN
    RAISE EXCEPTION 'review update count changed during merge';
  END IF;

  -- Preserve the union of genre relationships and coalesce identical links.
  INSERT INTO public.album_genres (album_id, genre_id, created_at)
  SELECT p_canonical_id, source.genre_id, min(source.created_at)
  FROM public.album_genres source
  WHERE source.album_id = ANY(p_duplicate_ids)
  GROUP BY source.genre_id
  ON CONFLICT (album_id, genre_id) DO NOTHING;

  DELETE FROM public.album_genres
  WHERE album_id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> v_album_genres THEN
    RAISE EXCEPTION 'album genre delete count changed during merge';
  END IF;

  UPDATE public.album_comments
  SET album_id = p_canonical_id
  WHERE album_id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> v_album_comments THEN
    RAISE EXCEPTION 'album comment update count changed during merge';
  END IF;

  UPDATE public.user_catalog
  SET album_id = p_canonical_id
  WHERE album_id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> v_user_catalog THEN
    RAISE EXCEPTION 'user catalog update count changed during merge';
  END IF;

  DELETE FROM public.albums
  WHERE id = ANY(p_duplicate_ids);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> cardinality(p_duplicate_ids) THEN
    RAISE EXCEPTION 'album delete count changed during merge';
  END IF;

  -- Keep the conceptual identifier even when it originally belonged to one
  -- of the deleted editions. This runs after deletion to satisfy its index.
  IF v_release_group_id IS NOT NULL THEN
    UPDATE public.albums
    SET release_group_id = v_release_group_id
    WHERE id = p_canonical_id
      AND release_group_id IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'canonical_id', p_canonical_id,
    'deleted_album_ids', p_duplicate_ids,
    'moved', jsonb_build_object(
      'reviews', v_reviews,
      'album_genres', v_album_genres,
      'album_comments', v_album_comments,
      'user_catalog', v_user_catalog
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.merge_duplicate_album_group(UUID, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_duplicate_album_group(UUID, UUID[]) FROM anon;
REVOKE ALL ON FUNCTION public.merge_duplicate_album_group(UUID, UUID[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_album_group(UUID, UUID[]) TO service_role;
