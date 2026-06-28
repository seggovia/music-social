import type { RequestHandler } from 'express';
import { followsService } from './follows.service.js';

export const followsController = {
  healthCheck: (async (_req, res) => {
    const result = await followsService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  follow: (async (req, res) => {
    const followerId = req.userId!;
    const followingId = req.params.userId as string;
    const result = await followsService.follow(followerId, followingId);
    res.status(201).json(result);
  }) as RequestHandler,

  unfollow: (async (req, res) => {
    const followerId = req.userId!;
    const followingId = req.params.userId as string;
    await followsService.unfollow(followerId, followingId);
    res.status(204).send();
  }) as RequestHandler,

  getFollowers: (async (req, res) => {
    const userId = req.params.userId as string;
    const followers = await followsService.getFollowers(userId);
    res.json(followers);
  }) as RequestHandler,

  getFollowing: (async (req, res) => {
    const userId = req.params.userId as string;
    const following = await followsService.getFollowing(userId);
    res.json(following);
  }) as RequestHandler,

  getStats: (async (req, res) => {
    const userId = req.params.userId as string;
    const viewerId = req.userId;
    const stats = await followsService.getStats(userId, viewerId);
    res.json(stats);
  }) as RequestHandler,
};