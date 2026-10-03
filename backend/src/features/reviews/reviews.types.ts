export interface ReviewsHealthResponse {
  status: string;
  feature: string;
}

export type ReviewsFeedScope = 'all' | 'following';

export type ReviewVoteValue = -1 | 1;

export interface ReviewVoteSummary {
  positive: number;
  negative: number;
  net: number;
  currentVote: ReviewVoteValue | null;
}

export interface ReviewFeedItem {
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
