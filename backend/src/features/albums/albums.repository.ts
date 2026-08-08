import { supabase } from '../../config/supabase.js';
import type { Pagination } from '../../shared/pagination.js';
import { createPaginatedResponse } from '../../shared/pagination.js';

interface ArtistJoin {
  name?: string | null;
  musicbrainz_id?: string | null;
}

interface GenreJoin {
  genres?: { name?: string | null } | null;
}

interface AlbumRecord {
  id: string;
  musicbrainz_id: string;
  release_group_id: string | null;
  title: string;
  release_date: string | null;
  cover_url: string | null;
  track_count: number | null;
  artist_id: string;
  artist_musicbrainz_id?: string | null;
  artists?: ArtistJoin | null;
  album_genres?: GenreJoin[];
}

function extractGenreNames(record: { album_genres?: GenreJoin[] }): string[] {
  return (record.album_genres ?? [])
    .map((ag) => ag.genres?.name)
    .filter((name): name is string => Boolean(name));
}

function mapAlbumRecord(record: AlbumRecord) {
  return {
    ...record,
    artist_musicbrainz_id: record.artists?.musicbrainz_id ?? null,
    genreNames: extractGenreNames(record),
  };
}

export const albumsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'albums' };
  },

  async findByMbid(mbid: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('*, artists(name, musicbrainz_id), album_genres(genres(name))')
      .eq('musicbrainz_id', mbid)
      .maybeSingle();

    if (error) throw error;
    const record = data as AlbumRecord | null;
    if (!record) return null;
    return mapAlbumRecord(record);
  },

  async findByReleaseGroupId(releaseGroupId: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('*, artists(name, musicbrainz_id), album_genres(genres(name))')
      .eq('release_group_id', releaseGroupId)
      .maybeSingle();

    if (error) throw error;
    const record = data as AlbumRecord | null;
    return record ? mapAlbumRecord(record) : null;
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('*, artists(name, musicbrainz_id), album_genres(genres(name))')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    const record = data as AlbumRecord | null;
    if (!record) return null;
    return mapAlbumRecord(record);
  },

  async search(query: string, pagination: Pagination) {
    const { data, error, count } = await supabase
      .from('albums')
      .select('*, artists(name, musicbrainz_id)', { count: 'exact' })
      .ilike('title', `%${query}%`)
      .order('title', { ascending: true })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;
    const records = (data ?? []).map((record: AlbumRecord) => ({
      ...record,
      artist_musicbrainz_id: record.artists?.musicbrainz_id ?? null,
    })) as AlbumRecord[];

    return createPaginatedResponse(records, count ?? 0, pagination);
  },

  async create(data: {
    musicbrainz_id: string;
    release_group_id: string | null;
    artist_id: string;
    title: string;
    release_date: string | null;
    cover_url: string | null;
    track_count: number | null;
  }) {
    if (data.release_group_id) {
      const existing = await albumsRepository.findByReleaseGroupId(data.release_group_id);
      if (existing) return existing;
    }

    const { data: created, error } = await supabase
      .from('albums')
      .insert(data)
      .select('*, artists(name, musicbrainz_id), album_genres(genres(name))')
      .single();

    if (error) {
      // The unique index is the final guard if two requests try to cache
      // different releases from the same release group concurrently.
      if (error.code === '23505') {
        const existingByGroup = data.release_group_id
          ? await albumsRepository.findByReleaseGroupId(data.release_group_id)
          : null;
        if (existingByGroup) return existingByGroup;

        const existingByRelease = await albumsRepository.findByMbid(data.musicbrainz_id);
        if (existingByRelease) return existingByRelease;
      }
      throw error;
    }

    return mapAlbumRecord(created as AlbumRecord);
  },

  async assignReleaseGroupId(albumId: string, releaseGroupId: string) {
    const { data, error } = await supabase
      .from('albums')
      .update({ release_group_id: releaseGroupId })
      .eq('id', albumId)
      .is('release_group_id', null)
      .select('*, artists(name, musicbrainz_id), album_genres(genres(name))')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        const existing = await albumsRepository.findByReleaseGroupId(releaseGroupId);
        if (existing) return existing;
      }
      throw error;
    }

    if (data) return mapAlbumRecord(data as AlbumRecord);
    return albumsRepository.findById(albumId);
  },

  /** Crea/encuentra cada género por nombre y conecta album_id <-> genre_id */
  /** Crea/encuentra cada género por nombre y conecta album_id <-> genre_id */
  async attachGenres(albumId: string, genreNames: string[]) {
    if (genreNames.length === 0) return;

    const normalizedNames = [...new Set(genreNames.map((n) => n.trim()).filter(Boolean))];
    if (normalizedNames.length === 0) return;

    const { data: existingGenres, error: fetchError } = await supabase
      .from('genres')
      .select('id, name')
      .in('name', normalizedNames);

    if (fetchError) throw fetchError;

    const existingNames = new Set((existingGenres ?? []).map((g: { name: string }) => g.name));
    const missingNames = normalizedNames.filter((n) => !existingNames.has(n));

    let createdGenres: { id: string; name: string }[] = [];
    if (missingNames.length > 0) {
      const slugify = (name: string) =>
        name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const { data, error: insertError } = await supabase
        .from('genres')
        .insert(missingNames.map((name) => ({ name, slug: slugify(name) })))
        .select('id, name');

      if (insertError) throw insertError;
      createdGenres = data ?? [];
    }

    const allGenres = [...(existingGenres ?? []), ...createdGenres] as { id: string; name: string }[];

    const { error: linkError } = await supabase
      .from('album_genres')
      .upsert(
        allGenres.map((g) => ({ album_id: albumId, genre_id: g.id })),
        { onConflict: 'album_id,genre_id', ignoreDuplicates: true },
      );

    if (linkError) throw linkError;
  },
};
