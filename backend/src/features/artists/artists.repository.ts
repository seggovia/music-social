import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';

export const artistsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'artists' };
  },

  async findByMbid(mbid: string) {
    const { data, error } = await supabase
      .from('artists')
      .select('*, albums(id, title, cover_url, release_date, track_count)')
      .eq('musicbrainz_id', mbid)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch artist', 500, error);
    return data;
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('artists')
      .select('*, albums(id, title, cover_url, release_date, track_count)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch artist', 500, error);
    return data;
  },

  async create(data: {
    musicbrainz_id: string;
    name: string;
    bio?: string | null;
    country?: string | null;
    image_url?: string | null;
    formed_year?: number | null;
  }) {
    const { data: artist, error } = await supabase
      .from('artists')
      .insert(data)
      .select()
      .single();

    if (error) throw new AppError('Failed to create artist', 500, error);
    return artist;
  },
};