export interface UserReview {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  albums?: {
    title: string;
    cover_url: string | null;
    artists?: { name: string }[];
  };
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  reviewCount: number;
  avgRating: number | null;
  reviews: UserReview[];
}

export interface UserSummary {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}