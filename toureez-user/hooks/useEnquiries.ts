

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';

import {
  createEnquiry,
  getEnquiryById,
  getMyEnquiries,
  sendEnquiryMessage,
} from '../lib/api/enquiries';
import { useAuthStore } from '../store/authStore';
import { Config } from '../constants/config';
import type { EnquiryDetail, EnquirySummary } from '../types';

export const enquiryQueryKeys = {
  all: ['enquiries'] as const,
  list: () => ['enquiries', 'list'] as const,
  detail: (id: string) => ['enquiries', 'detail', id] as const,
} as const;

export function useMyEnquiries(): UseQueryResult<EnquirySummary[], Error> {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery({
    queryKey: enquiryQueryKeys.list(),
    queryFn: async () => {
      const { data, error } = await getMyEnquiries();
      if (error || !data) throw new Error(error ?? 'Failed to load enquiries.');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

export function useEnquiryDetail(id: string): UseQueryResult<EnquiryDetail, Error> {
  const isAuthenticated = useAuthStore((state) => state.user !== null);

  return useQuery({
    queryKey: enquiryQueryKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await getEnquiryById(id);
      if (error || !data) throw new Error(error ?? 'Enquiry not found.');
      return data;
    },
    enabled: isAuthenticated && id.trim().length > 0,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
    retry: 1,
  });
}

interface CreateEnquiryInput {
  package_id: string;
  message: string;
}

export function useCreateEnquiry(): UseMutationResult<EnquiryDetail, Error, CreateEnquiryInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEnquiryInput) => {
      const { data, error } = await createEnquiry(input.package_id, input.message);
      if (error || !data) throw new Error(error ?? 'Failed to send enquiry.');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enquiryQueryKeys.list() });
    },
  });
}

interface SendEnquiryMessageInput {
  enquiry_id: string;
  message: string;
}

export function useSendEnquiryMessage(): UseMutationResult<EnquiryDetail, Error, SendEnquiryMessageInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendEnquiryMessageInput) => {
      const { data, error } = await sendEnquiryMessage(input.enquiry_id, input.message);
      if (error || !data) throw new Error(error ?? 'Failed to send message.');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(enquiryQueryKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: enquiryQueryKeys.list() });
    },
  });
}
