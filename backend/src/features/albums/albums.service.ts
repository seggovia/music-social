import { AppError } from '../../shared/errors/AppError.js';
import { getCoverArt } from '../../shared/integrations/cover-art-archive/index.js';
import { getAlbum, getArtist, searchAlbums } from '../../shared/integrations/musicbrainz/index.js';
import { albumsRepository } from './albums.repository.js';
import { getAlbumGenres } from '../../shared/integrations/lastfm/index.js';
import type { Pagination } from '../../shared/pagination.js';
import { createPaginatedResponse } from '../../shared/pagination.js';

function normalizeRelease(release: Record<string, unknown>) {
  const artistCredit = Array.isArray(release['artist-credit']) ? (release['artist-credit'] as Array<Record<string, unknown>>) : [];
  const artist = artistCredit[0]?.artist as Record<string, unknown> | undefined;
  const releaseGroup = release['release-group'] as Record<string, unknown> | undefined;
  const media = Array.isArray(release.media) ? (release.media as Array<Record<string, unknown>>) : [];
  const tags = Array.isArray(release.tags) ? (release.tags as Array<Record<string, unknown>>) : [];
  const genresField = Array.isArray(release.genres) ? (release.genres as Array<Record<string, unknown>>) : [];
  const rawDate = typeof release.date === 'string' ? release.date : null;
  const date = rawDate
    ? rawDate.length === 4
      ? `${rawDate}-01-01`
      : rawDate.length === 7
        ? `${rawDate}-01`
        : rawDate
    : null;
  const releaseTrackCount = typeof release['track-count'] === 'number' ? release['track-count'] : null;
  const mediaTrackCount = media.reduce((sum, item) => sum + (typeof item['track-count'] === 'number' ? item['track-count'] : 0), 0);

  return {
    mbid: typeof release.id === 'string' ? release.id : '',
    releaseGroupId: typeof releaseGroup?.id === 'string' ? releaseGroup.id : null,
    title: typeof release.title === 'string' ? release.title : 'Unknown album',
    artist: artistCredit.map((entry) => String(entry.name ?? '')).filter(Boolean).join(', ') || (artist?.name ? String(artist.name) : 'Unknown Artist'),
    artistMbid: typeof artist?.id === 'string' ? artist.id : null,
    coverUrl: null as string | null,
    year: date ? new Date(date).getFullYear() : null,
    releaseDate: date,
    trackCount: releaseTrackCount ?? (mediaTrackCount > 0 ? mediaTrackCount : null),
    genres: [...new Set([
      ...genresField.map((g) => String(g.name ?? '')),
      ...tags.map((tag) => String(tag.name ?? '')),
    ].filter(Boolean))],
    media,
  };
}

type NormalizedRelease = ReturnType<typeof normalizeRelease>;

export function uniqueReleasesByGroup(releases: Array<Record<string, unknown>>): NormalizedRelease[] {
  const seen = new Set<string>();

  return releases
    .map(normalizeRelease)
    .filter((release) => {
      const key = release.releaseGroupId ?? release.mbid;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function mapCachedAlbum(cached: Awaited<ReturnType<typeof albumsRepository.findById>>) {
  if (!cached) return null;

  return {
    id: cached.id,
    mbid: cached.musicbrainz_id,
    releaseGroupId: cached.release_group_id,
    title: cached.title,
    artist: cached.artists?.name ?? 'Unknown Artist',
    artistMbid: cached.artist_musicbrainz_id ?? null,
    coverUrl: cached.cover_url,
    year: cached.release_date ? new Date(cached.release_date).getFullYear() : null,
    releaseDate: cached.release_date,
    trackCount: cached.track_count,
    genres: cached.genreNames ?? [],
    tracks: [],
  };
}

export const albumsService = {
  async healthCheck() {
    return albumsRepository.healthCheck();
  },

  async search(query: string, pagination: Pagination) {
    if (!query.trim()) return createPaginatedResponse([], 0, pagination);

    const cached = await albumsRepository.search(query, pagination);
    if (cached.meta.total > 0) {
      return createPaginatedResponse(
        cached.data.map((album) => ({
          mbid: album.musicbrainz_id,
          releaseGroupId: album.release_group_id,
          title: album.title,
          artist: album.artists?.name ?? 'Unknown Artist',
          artistMbid: album.artists?.musicbrainz_id ?? null,
          coverUrl: album.cover_url,
          year: album.release_date ? new Date(album.release_date).getFullYear() : null,
        })),
        cached.meta.total,
        pagination,
      );
    }

    const response = await searchAlbums(query, { limit: pagination.limit, offset: pagination.offset });
    const releases = Array.isArray(response.releases) ? response.releases : [];
    const uniqueReleases = uniqueReleasesByGroup(releases as Array<Record<string, unknown>>);

    const results = await Promise.all(
      uniqueReleases.map(async (normalized) => {
        const cachedByGroup = normalized.releaseGroupId
          ? await albumsRepository.findByReleaseGroupId(normalized.releaseGroupId)
          : null;
        const cached = cachedByGroup ?? await albumsRepository.findByMbid(normalized.mbid);

        if (cached) {
          return {
            mbid: cached.musicbrainz_id,
            releaseGroupId: cached.release_group_id,
            title: cached.title,
            artist: cached.artists?.name ?? normalized.artist,
            artistMbid: cached.artist_musicbrainz_id ?? normalized.artistMbid,
            coverUrl: cached.cover_url,
            year: cached.release_date ? new Date(cached.release_date).getFullYear() : normalized.year,
          };
        }

        normalized.coverUrl = await getCoverArt(normalized.mbid);
        return normalized;
      }),
    );

    return createPaginatedResponse(results, response.count ?? results.length, pagination);
  },

  async getOrCache(mbid: string) {
    const cachedById = await albumsRepository.findById(mbid);
    if (cachedById) return mapCachedAlbum(cachedById);

    const cachedByRelease = await albumsRepository.findByMbid(mbid);
    if (cachedByRelease?.release_group_id) return mapCachedAlbum(cachedByRelease);

    const release = await getAlbum(mbid);
    const normalized = normalizeRelease(release as Record<string, unknown>);

    if (normalized.releaseGroupId) {
      const cachedByGroup = await albumsRepository.findByReleaseGroupId(normalized.releaseGroupId);
      if (cachedByGroup) return mapCachedAlbum(cachedByGroup);

      // Existing rows created before release_group_id was introduced are
      // claimed in place so their internal UUID and all references remain intact.
      if (cachedByRelease) {
        const claimed = await albumsRepository.assignReleaseGroupId(
          cachedByRelease.id,
          normalized.releaseGroupId,
        );
        return mapCachedAlbum(claimed ?? cachedByRelease);
      }
    } else if (cachedByRelease) {
      return mapCachedAlbum(cachedByRelease);
    }

    normalized.coverUrl = await getCoverArt(mbid);

    const artistCredit = Array.isArray(release['artist-credit']) ? release['artist-credit'] as Array<Record<string, unknown>> : [];
    const artist = artistCredit[0]?.artist as Record<string, unknown> | undefined;

    const resolvedArtist = artist && typeof artist.id === 'string' && typeof artist.name === 'string'
      ? { id: artist.id, name: artist.name }
      : { id: 'unknown', name: normalized.artist };

    const artistRecord = resolvedArtist.id !== 'unknown' ? await getArtist(resolvedArtist.id) : null;

    const { supabase } = await import('../../config/supabase.js');
    const { data: existingArtist, error: artistError } = await supabase
      .from('artists')
      .select('id, musicbrainz_id')
      .eq('musicbrainz_id', resolvedArtist.id)
      .maybeSingle();

    if (artistError) throw artistError;

    let artistId = existingArtist?.id;
    if (!artistId) {
      const { data: createdArtist, error: createArtistError } = await supabase
        .from('artists')
        .insert({
          musicbrainz_id: resolvedArtist.id,
          name: resolvedArtist.name,
          country: artistRecord && typeof artistRecord.country === 'string' ? artistRecord.country : null,
          disambiguation: artistRecord && typeof artistRecord.disambiguation === 'string' ? artistRecord.disambiguation : null,
          image_url: null,
        })
        .select('id')
        .single();

      if (createArtistError) throw new AppError('Failed to create artist', 500, createArtistError);
      artistId = createdArtist.id;
    }

    const inserted = await albumsRepository.create({
      musicbrainz_id: normalized.mbid,
      release_group_id: normalized.releaseGroupId,
      artist_id: artistId,
      title: normalized.title,
      release_date: normalized.releaseDate ?? null,
      cover_url: normalized.coverUrl,
      track_count: normalized.trackCount,
    });

    let finalGenres = normalized.genres;
    if (finalGenres.length === 0) {
      finalGenres = await getAlbumGenres(normalized.artist, normalized.title);
    }

    if (finalGenres.length > 0) {
      try {
        await albumsRepository.attachGenres(inserted.id, finalGenres);
      } catch (genreError) {
        console.error('Failed to attach genres for album', inserted.id, genreError);
      }
    }

    return {
      id: inserted.id,
      mbid: inserted.musicbrainz_id,
      releaseGroupId: inserted.release_group_id,
      title: inserted.title,
      artist: normalized.artist,
      artistMbid: normalized.artistMbid,
      coverUrl: inserted.cover_url,
      year: inserted.release_date ? new Date(inserted.release_date).getFullYear() : null,
      releaseDate: inserted.release_date,
      trackCount: normalized.trackCount,
      genres: finalGenres,
      tracks: [],
    };
  },
};
