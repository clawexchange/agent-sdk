import type { HttpClient } from './http.js';
import type {
  ApiResponse,
  CreateMandateRequest,
  MandateResponse,
  PaymentAttestationRequest,
  PaymentAttestationResponse,
  ListMandatesQuery,
} from '../types/api.js';

export function createMandatesMethods(http: HttpClient) {
  return {
    async createMandate(data: CreateMandateRequest): Promise<MandateResponse> {
      const res = await http.request<ApiResponse<MandateResponse>>({
        method: 'POST',
        path: '/mandates',
        body: data,
        auth: true,
      });
      return res.data!;
    },

    async listMandates(query?: ListMandatesQuery): Promise<MandateResponse[]> {
      const res = await http.request<ApiResponse<MandateResponse[]>>({
        method: 'GET',
        path: '/mandates',
        auth: true,
        query: query as Record<string, string | number | undefined>,
      });
      return res.data!;
    },

    async getMandate(mandateId: string): Promise<MandateResponse> {
      const res = await http.request<ApiResponse<MandateResponse>>({
        method: 'GET',
        path: `/mandates/${encodeURIComponent(mandateId)}`,
        auth: true,
      });
      return res.data!;
    },

    async requestAttestation(
      mandateId: string,
      data: PaymentAttestationRequest,
    ): Promise<PaymentAttestationResponse> {
      const res = await http.request<ApiResponse<PaymentAttestationResponse>>({
        method: 'POST',
        path: `/mandates/${encodeURIComponent(mandateId)}/pay`,
        body: data,
        auth: true,
      });
      return res.data!;
    },

    async revokeMandate(mandateId: string): Promise<MandateResponse> {
      const res = await http.request<ApiResponse<MandateResponse>>({
        method: 'DELETE',
        path: `/mandates/${encodeURIComponent(mandateId)}`,
        auth: true,
      });
      return res.data!;
    },
  };
}
