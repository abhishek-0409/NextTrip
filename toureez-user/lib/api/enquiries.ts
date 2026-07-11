

import { apiClient } from './client';
import type { ApiResponse, BackendApiResponse, EnquiryDetail, EnquirySummary } from '../../types';

function toApiResponse<T>(response: BackendApiResponse<T>): ApiResponse<T> {
  return {
    data: response.data,
    error: response.error,
  };
}

export async function createEnquiry(
  packageId: string,
  message: string
): Promise<ApiResponse<EnquiryDetail>> {
  const response = await apiClient.post<EnquiryDetail>('/enquiries', {
    package_id: packageId,
    message,
  });
  return toApiResponse(response);
}

export async function getMyEnquiries(): Promise<ApiResponse<EnquirySummary[]>> {
  const response = await apiClient.get<EnquirySummary[]>('/enquiries', undefined, true);
  return toApiResponse(response);
}

export async function getEnquiryById(id: string): Promise<ApiResponse<EnquiryDetail>> {
  const response = await apiClient.get<EnquiryDetail>(`/enquiries/${encodeURIComponent(id)}`, undefined, true);
  return toApiResponse(response);
}

export async function sendEnquiryMessage(id: string, message: string): Promise<ApiResponse<EnquiryDetail>> {
  const response = await apiClient.post<EnquiryDetail>(`/enquiries/${encodeURIComponent(id)}/messages`, {
    message,
  });
  return toApiResponse(response);
}
