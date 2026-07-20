import { getArtist, searchArtists } from '../../shared/integrations/musicbrainz/index.js';
import { artistsRepository } from './artists.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { createPaginatedResponse } from '../../shared/pagination.js';

interface ArtistRow {
  id: string;
  musicbrainz_id: string | null;
  name: string;
  disambiguation?: string | null;
  bio?: string | null;
  country?: string | null;
  image_url?: string | null;
  formed_year?: number | null;
  albums?: Array<Record<string, unknown>>;
  albumCount?: number;
  reviewCount?: number;
}

function mapArtistSummary(artist: ArtistRow) {
  const albums = Array.isArray(artist.albums) ? artist.albums : [];
  const reviewCount = typeof artist.reviewCount === 'number'
    ? artist.reviewCount
    : albums.reduce((sum, album) => {
        const reviews = album.reviews;
        return sum + (Array.isArray(reviews) ? reviews.length : 0);
      }, 0);

  return {
    id: artist.id,
    mbid: artist.musicbrainz_id ?? artist.id,
    name: artist.name,
    bio: artist.disambiguation ?? artist.bio ?? null,
    country: artist.country ?? null,
    imageUrl: artist.image_url ?? null,
    albumCount: typeof artist.albumCount === 'number' ? artist.albumCount : albums.length,
    reviewCount,
  };
}

function mapArtistDetail(artist: ArtistRow) {
  return {
    id: artist.id,
    mbid: artist.musicbrainz_id ?? artist.id,
    name: artist.name,
    bio: artist.disambiguation ?? artist.bio ?? null,
    country: artist.country ?? null,
    imageUrl: artist.image_url ?? null,
    formedYear: artist.formed_year ?? null,
    albums: (artist.albums ?? []).map((a: Record<string, unknown>) => ({
      id: a.id,
      title: a.title,
      coverUrl: a.cover_url,
      year: a.release_date ? new Date(String(a.release_date)).getFullYear() : null,
    })),
  };
}

function normalizeMusicBrainzArtist(raw: Record<string, unknown>) {
  const mbid = typeof raw.id === 'string' ? raw.id : '';
  const name = typeof raw.name === 'string' ? raw.name : '';

  return {
    mbid,
    name,
    country: typeof raw.country === 'string' ? raw.country : null,
    disambiguation: typeof raw.disambiguation === 'string' ? raw.disambiguation : null,
  };
}

export const artistsService = {
  async healthCheck() {
    return artistsRepository.healthCheck();
  },

  async popular(pagination: Pagination) {
    const artists = await artistsRepository.popular(pagination);
    return createPaginatedResponse(
      artists.data.map((artist) => mapArtistSummary(artist as ArtistRow)),
      artists.meta.total,
      pagination,
    );
  },

  async search(query: string, pagination: Pagination) {
    if (!query.trim()) return createPaginatedResponse([], 0, pagination);

    const cached = await artistsRepository.searchByName(query, pagination);
    const hasEnoughCachedResults = cached.data.length >= pagination.limit || cached.meta.hasMore;
    if (hasEnoughCachedResults) {
      return createPaginatedResponse(
        cached.data.map((artist) => mapArtistSummary(artist as ArtistRow)),
        cached.meta.total,
        pagination,
      );
    }

    const response = await searchArtists(query, { limit: pagination.limit, offset: pagination.offset });
    const rawArtists = Array.isArray(response.artists) ? response.artists : [];
    const cachedFromMusicBrainz = await Promise.all(
      rawArtists.map(async (raw) => {
        const normalized = normalizeMusicBrainzArtist(raw);
        if (!normalized.mbid || !normalized.name) return null;

        const existing = await artistsRepository.findByMbid(normalized.mbid);
        if (existing) return existing as ArtistRow;

        return artistsRepository.create({
          musicbrainz_id: normalized.mbid,
          name: normalized.name,
          country: normalized.country,
          disambiguation: normalized.disambiguation,
          image_url: null,
        }) as Promise<ArtistRow>;
      }),
    );

    const merged = [...cached.data, ...cachedFromMusicBrainz.filter((artist): artist is ArtistRow => artist !== null)];
    const seen = new Set<string>();
    const unique = merged.filter((artist) => {
      const key = artist.musicbrainz_id ?? artist.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return createPaginatedResponse(
      unique.slice(0, pagination.limit).map((artist) => mapArtistSummary(artist as ArtistRow)),
      Math.max(cached.meta.total, response.count ?? unique.length),
      pagination,
    );
  },

  async getOrCache(mbid: string) {
    const cached = await artistsRepository.findByMbid(mbid) ?? await artistsRepository.findById(mbid);
    if (cached) {
      return mapArtistDetail(cached as ArtistRow);
    }

    const raw = await getArtist(mbid);

    if (!raw || typeof raw.name !== 'string') {
      throw new AppError('Artist not found in MusicBrainz', 404);
    }

    const formedYear = typeof raw['life-span'] === 'object' && raw['life-span'] !== null
      ? (() => {
          const ls = raw['life-span'] as Record<string, unknown>;
          return typeof ls.begin === 'string' ? Number(ls.begin.slice(0, 4)) : null;
        })()
      : null;

    const artist = await artistsRepository.create({
      musicbrainz_id: mbid,
      name: raw.name,
      disambiguation: typeof raw.disambiguation === 'string' ? raw.disambiguation : null,
      country: typeof raw.country === 'string' ? raw.country : null,
      image_url: null,
    });

    return {
      id: artist.id,
      mbid: artist.musicbrainz_id,
      name: artist.name,
      bio: artist.disambiguation ?? null,
      country: artist.country,
      imageUrl: artist.image_url,
      formedYear,
      albums: [],
    };
  },
};
