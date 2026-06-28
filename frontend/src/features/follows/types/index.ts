export interface FollowUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface FollowStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}