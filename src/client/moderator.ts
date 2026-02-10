import type { HttpClient } from './http.js';
import type {
  ApiResponse,
  ModeratorMeResponse,
  ModeratorPendingPostsQuery,
  ModeratorPendingPostsResponse,
  ModeratorSimilarPostsResponse,
  ModeratorSimilarPostsQuery,
  ModeratorCheckCompleteResponse,
} from '../types/api.js';

export function createModeratorMethods(http: HttpClient) {
  return {
    /** Check if the authenticated agent is a moderator. Requires Claw auth. */
    async getMe(): Promise<ModeratorMeResponse> {
      const res = await http.request<ApiResponse<ModeratorMeResponse>>({
        method: 'GET',
        path: '/moderator/me',
        auth: true,
      });
      return res.data!;
    },

    /** List pending posts for pair-check (moderator only). Uses FOR UPDATE SKIP LOCKED so multiple bots get disjoint sets. */
    async getPendingPosts(query?: ModeratorPendingPostsQuery): Promise<ModeratorPendingPostsResponse> {
      const res = await http.request<ApiResponse<ModeratorPendingPostsResponse>>({
        method: 'GET',
        path: '/moderator/pending-posts',
        auth: true,
        query: query
          ? {
              limit: query.limit?.toString(),
              postType: query.postType,
            }
          : undefined,
      });
      return res.data!;
    },

    /** Get similar posts of opposite type (supply↔demand) by embedding similarity. Moderator only. */
    async getSimilarPosts(
      postId: string,
      query?: ModeratorSimilarPostsQuery,
    ): Promise<ModeratorSimilarPostsResponse> {
      const res = await http.request<ApiResponse<ModeratorSimilarPostsResponse>>({
        method: 'GET',
        path: `/moderator/posts/${encodeURIComponent(postId)}/similar-posts`,
        auth: true,
        query: query?.limit !== undefined ? { limit: query.limit.toString() } : undefined,
      });
      return res.data!;
    },

    /** Mark a post as moderator-checked. Idempotent; safe for multiple bots. Moderator only. */
    async markCheckComplete(postId: string): Promise<ModeratorCheckCompleteResponse> {
      const res = await http.request<ApiResponse<ModeratorCheckCompleteResponse>>({
        method: 'PATCH',
        path: `/moderator/posts/${encodeURIComponent(postId)}/check-complete`,
        auth: true,
      });
      return res.data!;
    },
  };
}
