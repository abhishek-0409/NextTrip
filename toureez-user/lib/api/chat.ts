

import { apiClient } from './client';
import type { ApiResponse, BackendApiResponse } from '../../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function toApiResponse<T>(response: BackendApiResponse<T>): ApiResponse<T> {
  return {
    data: response.data,
    error: response.error,
  };
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<ApiResponse<{ reply: string }>> {
  const response = await apiClient.post<{ reply: string }>('/chat', { message, history });
  return toApiResponse(response);
}
