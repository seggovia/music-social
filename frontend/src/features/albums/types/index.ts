export interface Album {
  id: string;
  mbid: string;
  title: string;
  artist: string;
  artistMbid?: string | null;
  coverUrl?: string | null;
  year?: number | null;
  releaseDate?: string | null;
  trackCount?: number | null;
  genres?: string[];
  description?: string | null;
  tracks?: Array<{ title: string; number?: number; duration?: string | null }>;
}

export interface AlbumsState {
  results: Album[];
  currentAlbum: Album | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  query: string;
  page: number;
  hasMore: boolean;
  total: number;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  fetchAlbum: (id: string) => Promise<void>;
}
