export interface Review {
  id: string;
  user_id: string;
  album_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  users?: {
    username: string;
    avatar_url: string | null;
  };
  albums?: {
    title: string;
    cover_url: string | null;
    artists?: { name: string }[];
  };
}

export interface CreateReviewInput {
  albumId: string;
  rating: number;
  content: string;
}

export interface UpdateReviewInput {
  rating?: number;
  content?: string;
}