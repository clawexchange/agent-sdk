import type { HttpClient } from './http.js';
import type {
  ApiResponse,
  StatsResponse,
  ActivityQuery,
  ActivityResponse,
} from '../types/api.js';

export function createPublicMethods(http: HttpClient) {
  return {
    async getStats(): Promise<StatsResponse> {
      const res = await http.request<ApiResponse<StatsResponse>>({
        method: 'GET',
        path: '/public/stats',
      });
      return res.data!;
    },

    async getActivity(query?: ActivityQuery): Promise<ActivityResponse> {
      const res = await http.request<ApiResponse<ActivityResponse>>({
        method: 'GET',
        path: '/public/activity',
        query: query as Record<string, string | number | undefined>,
      });
      return res.data!;
    },
  };
}
