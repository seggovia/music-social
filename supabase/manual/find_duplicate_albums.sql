-- Read-only audit query. This deliberately does not update, merge, or delete
-- any album. Same-title rows for one artist are candidates for manual review,
-- not proof that they belong to the same MusicBrainz release group.

WITH album_candidates AS (
  SELECT
    a.id,
    a.artist_id,
    ar.name AS artist_name,
    a.title,
    lower(regexp_replace(btrim(a.title), '\s+', ' ', 'g')) AS normalized_title,
    a.musicbrainz_id,
    a.release_group_id,
    a.release_date,
    a.created_at,
    (SELECT count(*) FROM public.reviews r WHERE r.album_id = a.id) AS review_count,
    (SELECT count(*) FROM public.user_catalog uc WHERE uc.album_id = a.id) AS catalog_count,
    (SELECT count(*) FROM public.album_comments ac WHERE ac.album_id = a.id) AS album_comment_count
  FROM public.albums a
  JOIN public.artists ar ON ar.id = a.artist_id
),
duplicate_groups AS (
  SELECT artist_id, normalized_title
  FROM album_candidates
  GROUP BY artist_id, normalized_title
  HAVING count(*) > 1
)
SELECT
  candidates.artist_name,
  min(candidates.title) AS sample_title,
  candidates.normalized_title,
  count(*) AS candidate_count,
  jsonb_agg(
    jsonb_build_object(
      'album_id', candidates.id,
      'release_mbid', candidates.musicbrainz_id,
      'release_group_id', candidates.release_group_id,
      'release_date', candidates.release_date,
      'reviews', candidates.review_count,
      'catalog_entries', candidates.catalog_count,
      'album_comments', candidates.album_comment_count,
      'created_at', candidates.created_at
    )
    ORDER BY candidates.created_at, candidates.id
  ) AS rows_to_review
FROM album_candidates candidates
JOIN duplicate_groups duplicates
  ON duplicates.artist_id = candidates.artist_id
 AND duplicates.normalized_title = candidates.normalized_title
GROUP BY candidates.artist_id, candidates.artist_name, candidates.normalized_title
ORDER BY candidate_count DESC, candidates.artist_name, candidates.normalized_title;
