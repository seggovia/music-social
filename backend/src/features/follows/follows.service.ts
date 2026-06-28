import { AppError } from '../../shared/errors/AppError.js';
import { followsRepository } from './follows.repository.js';

export const followsService = {
  async healthCheck() {
    return followsRepository.healthCheck();
  },

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError('You cannot follow yourself', 400);
    }
    const alreadyFollowing = await followsRepository.exists(followerId, followingId);
    if (alreadyFollowing) {
      throw new AppError('You already follow this user', 409);
    }
    return followsRepository.create(followerId, followingId);
  },

  async unfollow(followerId: string, followingId: string) {
    await followsRepository.remove(followerId, followingId);
  },

  async getFollowers(userId: string) {
    return followsRepository.listFollowers(userId);
  },

  async getFollowing(userId: string) {
    return followsRepository.listFollowing(userId);
  },

  async getStats(userId: string, viewerId?: string) {
    const [followerCount, followingCount, isFollowing] = await Promise.all([
      followsRepository.countFollowers(userId),
      followsRepository.countFollowing(userId),
      viewerId ? followsRepository.exists(viewerId, userId) : Promise.resolve(false),
    ]);

    return { followerCount, followingCount, isFollowing };
  },
};