import { getCoverArt } from '../../shared/integrations/cover-art-archive/index.js';
import { getAlbum, getArtist, searchAlbums } from '../../shared/integrations/musicbrainz/index.js';
import { albumsRepository } from './albums.repository.js';

function normalizeRelease(release: Record<string, unknown>) {
  const artistCredit = Array.isArray(release['artist-credit']) ? (release['artist-credit'] as Array<Record<string, unknown>>) : [];
  const artist = artistCredit[0]?.artist as Record<string, unknown> | undefined;
  const media = Array.isArray(release.media) ? (release.media as Array<Record<string, unknown>>) : [];
  const tags = Array.isArray(release.tags) ? (release.tags as Array<Record<string, unknown>>) : [];
  const date = typeof release.date === 'string' ? release.date : null;
  const releaseTrackCount = typeof release['track-count'] === 'number' ? release['track-count'] : null;
  const mediaTrackCount = media.reduce((sum, item) => sum + (typeof item['track-count'] === 'number' ? item['track-count'] : 0), 0);

  return {
    mbid: typeof release.id === 'string' ? release.id : '',
    title: typeof release.title === 'string' ? release.title : 'Unknown album',
    artist: artistCredit.map((entry) => String(entry.name ?? '')).filter(Boolean).join(', ') || (artist?.name ? String(artist.name) : 'Unknown Artist'),
    artistMbid: typeof artist?.id === 'string' ? artist.id : null,
    coverUrl: null as string | null,
    year: date ? new Date(date).getFullYear() : null,
    releaseDate: date,
    trackCount: releaseTrackCount ?? (mediaTrackCount > 0 ? mediaTrackCount : null),
    genres: tags.map((tag) => String(tag.name ?? '')).filter(Boolean),
    media,
  };
}

export const albumsService = {
  async healthCheck() {
    return albumsRepository.healthCheck();
  },

  async search(query: string) {
    if (!query.trim()) {
      return [];
    }

    const cached = await albumsRepository.search?.(query);
    if (cached && cached.length > 0) {
      return cached;
    }

    const response = await searchAlbums(query);
    const releases = Array.isArray(response.releases) ? response.releases : [];

    const results = await Promise.all(
      releases.map(async (release) => {
        const normalized = normalizeRelease(release as Record<string, unknown>);
        normalized.coverUrl = await getCoverArt(normalized.mbid);
        return normalized;
      }),
    );

    return results;
  },

  async getOrCache(mbid: string) {
    const cached = await albumsRepository.findByMbid(mbid);
    if (cached) {
      return {
        id: cached.id,
        mbid: cached.musicbrainz_id,
        title: cached.title,
        artist: cached.artists?.name ?? 'Unknown Artist',
        coverUrl: cached.cover_url,
        year: cached.release_date ? new Date(cached.release_date).getFullYear() : null,
        releaseDate: cached.release_date,
        trackCount: cached.track_count,
      };
    }

    const release = await getAlbum(mbid);
    const normalized = normalizeRelease(release as Record<string, unknown>);
    const coverUrl = await getCoverArt(mbid);
    normalized.coverUrl = coverUrl;

    const artistCredit = Array.isArray(release['artist-credit']) ? release['artist-credit'] as Array<Record<string, unknown>> : [];
    const artist = artistCredit[0]?.artist as Record<string, unknown> | undefined;

    const fallbackArtist = {
      id: 'unknown',
      name: 'Unknown Artist',
    };

    const resolvedArtist =
      artist && typeof artist.id === 'string' && typeof artist.name === 'string'
        ? { id: artist.id, name: artist.name }
        : fallbackArtist;

    const artistRecord = resolvedArtist.id === 'unknown'
      ? null
      : await getArtist(resolvedArtist.id);

    const { supabase } = await import('../../config/supabase.js');
    const { data: existingArtist, error: artistError } = await supabase
      .from('artists')
      .select('id')
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

      if (createArtistError) throw createArtistError;
      artistId = createdArtist.id;
    }

    const inserted = await albumsRepository.create({
      musicbrainz_id: normalized.mbid,
      artist_id: artistId,
      title: normalized.title,
      release_date: normalized.releaseDate ?? null,
      cover_url: normalized.coverUrl,
      track_count: normalized.trackCount,
    });

    return {
      id: inserted.id,
      mbid: inserted.musicbrainz_id,
      title: inserted.title,
      artist: normalized.artist,
      coverUrl: inserted.cover_url,
      year: inserted.release_date ? new Date(inserted.release_date).getFullYear() : null,
      releaseDate: inserted.release_date,
      trackCount: normalized.trackCount,
      genres: normalized.genres,
      tracks: [],
    };
  },
};
