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
  tracks?: Array<{ title: string; number?: number }>;
}

export interface AlbumsState {
  results: Album[];
  currentAlbum: Album | null;
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  fetchAlbum: (id: string) => Promise<void>;
}
