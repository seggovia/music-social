import { getArtist } from '../../shared/integrations/musicbrainz/index.js';
import { artistsRepository } from './artists.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export const artistsService = {
  async healthCheck() {
    return artistsRepository.healthCheck();
  },

  async getOrCache(mbid: string) {
    const cached = await artistsRepository.findByMbid(mbid);
    if (cached) {
      return {
        id: cached.id,
        mbid: cached.musicbrainz_id,
        name: cached.name,
        bio: cached.bio,
        country: cached.country,
        imageUrl: cached.image_url,
        formedYear: cached.formed_year,
        albums: (cached.albums ?? []).map((a: Record<string, unknown>) => ({
          id: a.id,
          title: a.title,
          coverUrl: a.cover_url,
          year: a.release_date ? new Date(String(a.release_date)).getFullYear() : null,
        })),
      };
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
      bio: typeof raw.disambiguation === 'string' ? raw.disambiguation : null,
      country: typeof raw.country === 'string' ? raw.country : null,
      image_url: null,
      formed_year: formedYear,
    });

    return {
      id: artist.id,
      mbid: artist.musicbrainz_id,
      name: artist.name,
      bio: artist.bio,
      country: artist.country,
      imageUrl: artist.image_url,
      formedYear: artist.formed_year,
      albums: [],
    };
  },
};