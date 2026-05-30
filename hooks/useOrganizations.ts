import { useQuery } from '@tanstack/react-query';
import {
   getOrganizations,
   getOrganizationById,
   getOrganizationAudiobooks,
} from '@/services/organizations';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function useOrganizations() {
   const enabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: ['organizations'],
      queryFn: () => getOrganizations(),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
   });
}

export function useOrganization(organizationId: string) {
   const enabled = useAuthQueryEnabled(!!organizationId);

   return useQuery({
      queryKey: ['organization', organizationId],
      queryFn: () => getOrganizationById(organizationId),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
   });
}

export function useOrganizationAudiobooks(organizationId: string, page = 1) {
   const enabled = useAuthQueryEnabled(!!organizationId);

   return useQuery({
      queryKey: ['organizationAudiobooks', organizationId, page],
      queryFn: () => getOrganizationAudiobooks(organizationId, page),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
   });
}
