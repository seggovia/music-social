export interface ReviewsHealthResponse {
  status: string;
  feature: string;
}

export type ReviewsFeedScope = 'all' | 'following';

export interface ReviewFeedItem {
  id: string;
  userId: string;
  albumId: string;
  rating: number;
  content: string;
  createdAt: string;
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
