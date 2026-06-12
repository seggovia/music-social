import { supabase } from '../../config/supabase.js';

interface AlbumRecord {
  id: string;
  musicbrainz_id: string;
  title: string;
  release_date: string | null;
  cover_url: string | null;
  track_count: number | null;
  artist_id: string;
  artists?: Array<{ id: string; name: string }> | null;
}

export const albumsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'albums' };
  },

  async findByMbid(mbid: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, musicbrainz_id, title, release_date, cover_url, track_count, artist_id, artists(id, name)')
      .eq('musicbrainz_id', mbid)
      .maybeSingle();

    if (error) throw error;
    return data as AlbumRecord | null;
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, musicbrainz_id, title, release_date, cover_url, track_count, artist_id, artists(id, name)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as AlbumRecord | null;
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, musicbrainz_id, title, release_date, cover_url, track_count, artist_id, artists(id, name)')
      .ilike('title', `%${query}%`)
      .limit(20);

    if (error) throw error;
    return (data ?? []) as AlbumRecord[];
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
      .select('id, musicbrainz_id, title, release_date, cover_url, track_count, artist_id, artists(id, name)')
      .single();

    if (error) throw error;
    return created as AlbumRecord;
  },
};
