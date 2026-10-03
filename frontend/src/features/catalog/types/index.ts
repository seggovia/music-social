export interface CatalogAlbum {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  year: number | null;
  listenedAt: string;
  source: 'catalog' | 'review' | 'both';
}

export interface AlbumListenedState {
  listened: boolean;
  explicit: boolean;
  inferredFromReview: boolean;
}
