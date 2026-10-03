import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { CatalogAlbum } from './catalog.types.js';

interface ArtistJoin {
  name: string;
}

interface AlbumJoin {
  id: string;
  title: string;
  cover_url: string | null;
  release_date: string | null;
  artists?: ArtistJoin | ArtistJoin[] | null;
}

interface CatalogRecord {
  album_id: string;
  created_at: string;
  albums?: AlbumJoin | AlbumJoin[] | null;
}

function singleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapAlbum(record: CatalogRecord, source: 'catalog' | 'review'): CatalogAlbum {
  const album = singleRelation(record.albums);
  const artist = singleRelation(album?.artists);

  return {
    id: album?.id ?? record.album_id,
    title: album?.title ?? 'Unknown album',
    artist: artist?.name ?? 'Unknown artist',
    coverUrl: album?.cover_url ?? null,
    year: album?.release_date ? new Date(album.release_date).getFullYear() : null,
    listenedAt: record.created_at,
    source,
  };
}

const ALBUM_SELECT =
  'album_id, created_at, albums(id, title, cover_url, release_date, artists(name))' as const;

export const catalogRepository = {
  async findExplicitListened(userId: string, albumId: string) {
    const { data, error } = await supabase
      .from('user_catalog')
      .select('id')
      .eq('user_id', userId)
      .eq('album_id', albumId)
      .eq('status', 'listened')
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch catalog state', 500, error);
    return Boolean(data);
  },

  async markListened(userId: string, albumId: string) {
    const { error } = await supabase
      .from('user_catalog')
      .upsert(
        { user_id: userId, album_id: albumId, status: 'listened' },
        { onConflict: 'user_id,album_id' },
      );

    if (error) throw new AppError('Failed to mark album as listened', 500, error);
  },

  async unmarkListened(userId: string, albumId: string) {
    const { error } = await supabase
      .from('user_catalog')
      .delete()
      .eq('user_id', userId)
      .eq('album_id', albumId)
      .eq('status', 'listened');

    if (error) throw new AppError('Failed to unmark album as listened', 500, error);
  },

  async listExplicitListened(userId: string) {
    const { data, error } = await supabase
      .from('user_catalog')
      .select(ALBUM_SELECT)
      .eq('user_id', userId)
      .eq('status', 'listened');

    if (error) throw new AppError('Failed to fetch listened catalog', 500, error);
    return (data ?? []).map((record) => mapAlbum(record as CatalogRecord, 'catalog'));
  },

  async listReviewedAlbums(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(ALBUM_SELECT)
      .eq('user_id', userId);

    if (error) throw new AppError('Failed to fetch reviewed albums for catalog', 500, error);
    return (data ?? []).map((record) => mapAlbum(record as CatalogRecord, 'review'));
  },
};
