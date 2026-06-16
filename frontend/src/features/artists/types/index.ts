export interface ArtistAlbum {
  id: string;
  title: string;
  coverUrl: string | null;
  year: number | null;
}

export interface Artist {
  id: string;
  mbid: string;
  name: string;
  bio: string | null;
  country: string | null;
  imageUrl: string | null;
  formedYear: number | null;
  albums: ArtistAlbum[];
}