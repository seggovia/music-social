import { supabase } from '../../../config/supabase.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { Pagination } from '../../../shared/pagination.js';
import { createPaginatedResponse } from '../../../shared/pagination.js';
import type { ReviewComment } from './review-comments.types.js';

interface UserJoin {
  username: string;
  avatar_url: string | null;
}

interface ReviewCommentRecord {
  id: string;
  review_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  users?: UserJoin | UserJoin[] | null;
}

function singleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapComment(record: ReviewCommentRecord): ReviewComment {
  const author = singleRelation(record.users);

  return {
    id: record.id,
    reviewId: record.review_id,
    userId: record.user_id,
    content: record.body,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    author: {
      username: author?.username ?? 'Unknown user',
      avatarUrl: author?.avatar_url ?? null,
    },
  };
}

const COMMENT_SELECT =
  'id, review_id, user_id, body, created_at, updated_at, users(username, avatar_url)' as const;

export const reviewCommentsRepository = {
  async create(reviewId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from('review_comments')
      .insert({
        review_id: reviewId,
        user_id: userId,
        body: content,
      })
      .select(COMMENT_SELECT)
      .single();

    if (error) throw new AppError('Failed to create review comment', 500, error);
    return mapComment(data as ReviewCommentRecord);
  },

  async findByReview(reviewId: string, pagination: Pagination) {
    const { data, error, count } = await supabase
      .from('review_comments')
      .select(COMMENT_SELECT, { count: 'exact' })
      .eq('review_id', reviewId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw new AppError('Failed to fetch review comments', 500, error);
    const comments = (data ?? []).map((record) => mapComment(record as ReviewCommentRecord));
    return createPaginatedResponse(comments, count ?? 0, pagination);
  },

  async findById(reviewId: string, commentId: string) {
    const { data, error } = await supabase
      .from('review_comments')
      .select('id, review_id, user_id')
      .eq('id', commentId)
      .eq('review_id', reviewId)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch review comment', 500, error);
    return data as { id: string; review_id: string; user_id: string } | null;
  },

  async delete(reviewId: string, commentId: string, userId: string) {
    const { error } = await supabase
      .from('review_comments')
      .delete()
      .eq('id', commentId)
      .eq('review_id', reviewId)
      .eq('user_id', userId);

    if (error) throw new AppError('Failed to delete review comment', 500, error);
  },
};
