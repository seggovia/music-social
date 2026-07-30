export interface UsersHealthResponse {
  status: string;
  feature: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_preference: 'light' | 'dark';
  created_at: string;
  reviewCount: number;
  avgRating: number | null;
}

export interface UserSummary {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}
