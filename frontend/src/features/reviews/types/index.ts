export interface Review {
  id: string;
  user_id: string;
  album_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  review_comments?: Array<{ count: number }>;
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

export type ReviewFeedScope = 'all' | 'following';

export interface FeedReview {
  id: string;
  userId: string;
  albumId: string;
  rating: number;
  content: string;
  createdAt: string;
  commentCount: number;
  author: {
    username: string;
    avatarUrl: string | null;
  };
  album: {
    id: string;
    title: string;
    coverUrl: string | null;
    artist: {
      id: string;
      name: string;
    };
  };
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    avatarUrl: string | null;
  };
}
