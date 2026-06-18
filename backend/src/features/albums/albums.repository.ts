import { supabase } from '../../config/supabase.js';

interface ArtistJoin {
  name?: string | null;
  musicbrainz_id?: string | null;
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
}

export const albumsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'albums' };
  },

  async findByMbid(mbid: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('*, artists(name, musicbrainz_id)')
      .eq('musicbrainz_id', mbid)
      .maybeSingle();

    if (error) throw error;
    const record = data as AlbumRecord | null;
    if (!record) return null;
    return {
      ...record,
      artist_musicbrainz_id: record.artists?.musicbrainz_id ?? null,
    };
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('*, artists(name, musicbrainz_id)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    const record = data as AlbumRecord | null;
    if (!record) return null;
    return {
      ...record,
      artist_musicbrainz_id: record.artists?.musicbrainz_id ?? null,
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
};