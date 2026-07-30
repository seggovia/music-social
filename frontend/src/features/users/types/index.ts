export interface SocialLinks {
  spotify_url: string | null;
  lastfm_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  bandcamp_url: string | null;
}

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

export interface UserProfile extends SocialLinks {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_preference: 'light' | 'dark';
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

export interface TopReviewerUser extends UserSummary {
  reviewCount: number;
}

export interface GenreUser extends UserSummary {
  topGenre: string | null;
}

export interface AffinityUser extends UserSummary {
  sharedAlbums: number;
  avgRatingDiff: number;
}

export type UsersFilter = 'all' | 'top-reviewers' | 'by-genre' | 'similar' | 'opposite';

export interface UpdateProfileInput extends Partial<SocialLinks> {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  theme_preference?: 'light' | 'dark';
}
