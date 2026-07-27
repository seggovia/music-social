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
