export interface ChartAlbum {
  id: string;
  title: string;
  coverUrl: string | null;
  artist: string;
  year: number | null;
  avgRating: number;
  reviewCount: number;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export type ChartTab = 'most-reviewed' | 'top-all-time' | 'top-by-year' | 'top-by-genre';