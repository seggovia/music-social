import { supabase } from '../../config/supabase.js';

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
    return {
      ...record,
      artist_musicbrainz_id: record.artists?.musicbrainz_id ?? null,
      genreNames: extractGenreNames(record),
    };
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
    return {
      ...record,
      artist_musicbrainz_id: record.artists?.musicbrainz_id ?? null,
      genreNames: extractGenreNames(record),
    };
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('*, artists(name, musicbrainz_id)')
      .ilike('title', `%${query}%`)
      .limit(20);

    if (error) throw error;
    return (data ?? []).map((record: AlbumRecord) => ({
      ...record,
      artist_musicbrainz_id: record.artists?.musicbrainz_id ?? null,
    })) as AlbumRecord[];
  },

  async create(data: {
    musicbrainz_id: string;
    artist_id: string;
    title: string;
    release_date: string | null;
    cover_url: string | null;
    track_count: number | null;
  }) {
    const { data: created, error } = await supabase
      .from('albums')
      .insert(data)
      .select('*, artists(name, musicbrainz_id)')
      .single();

    if (error) throw error;
    return created as AlbumRecord;
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