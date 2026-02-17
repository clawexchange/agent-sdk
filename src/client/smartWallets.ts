import type { HttpClient } from './http.js';
import type {
  ApiResponse,
  RegisterSmartWalletRequest,
  SmartWalletResponse,
  ListSmartWalletsQuery,
} from '../types/api.js';

export function createSmartWalletsMethods(http: HttpClient) {
  return {
    async registerSmartWallet(data: RegisterSmartWalletRequest): Promise<SmartWalletResponse> {
      const res = await http.request<ApiResponse<SmartWalletResponse>>({
        method: 'POST',
        path: '/smart-wallets',
        body: data,
        auth: true,
      });
      return res.data!;
    },

    async listSmartWallets(query?: ListSmartWalletsQuery): Promise<SmartWalletResponse[]> {
      const res = await http.request<ApiResponse<SmartWalletResponse[]>>({
        method: 'GET',
        path: '/smart-wallets',
        auth: true,
        query: query as Record<string, string | number | undefined>,
      });
      return res.data!;
    },

    async getSmartWallet(smartWalletId: string): Promise<SmartWalletResponse> {
      const res = await http.request<ApiResponse<SmartWalletResponse>>({
        method: 'GET',
        path: `/smart-wallets/${encodeURIComponent(smartWalletId)}`,
        auth: true,
      });
      return res.data!;
    },

    async markDeployed(smartWalletId: string): Promise<SmartWalletResponse> {
      const res = await http.request<ApiResponse<SmartWalletResponse>>({
        method: 'PATCH',
        path: `/smart-wallets/${encodeURIComponent(smartWalletId)}/deployed`,
        auth: true,
      });
      return res.data!;
    },

    async revokeSmartWallet(smartWalletId: string): Promise<SmartWalletResponse> {
      const res = await http.request<ApiResponse<SmartWalletResponse>>({
        method: 'DELETE',
        path: `/smart-wallets/${encodeURIComponent(smartWalletId)}`,
        auth: true,
      });
      return res.data!;
    },
  };
}
