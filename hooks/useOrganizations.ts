import { useQuery } from '@tanstack/react-query';
import {
   getOrganizations,
   getOrganizationById,
   getOrganizationAudiobooks,
} from '@/services/organizations';
import { queryKeys } from '@/constants/queryKeys';
import { isNotFoundError } from '@/utils/isNotFoundError';
import { shouldRetryQuery } from '@/utils/queryRetry';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useResourceDeleted } from './useResourceDeleted';

export function useOrganizations() {
   const enabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: queryKeys.organizations.all(),
      queryFn: () => getOrganizations(),
      enabled,
      retry: shouldRetryQuery,
   });
}

export function useOrganization(organizationId: string) {
   const isDeleted = useResourceDeleted('organizations', organizationId);
   const enabled = useAuthQueryEnabled(!!organizationId && !isDeleted);

   const query = useQuery({
      queryKey: queryKeys.organizations.detail(organizationId),
      queryFn: () => getOrganizationById(organizationId),
      enabled,
      retry: shouldRetryQuery,
      meta: { silent404: true },
   });

   const isNotFound = isDeleted || isNotFoundError(query.error);

   return {
      ...query,
      isNotFound,
   };
}

export function useOrganizationAudiobooks(organizationId: string, page = 1) {
   const isDeleted = useResourceDeleted('organizations', organizationId);
   const enabled = useAuthQueryEnabled(!!organizationId && !isDeleted);

   return useQuery({
      queryKey: queryKeys.organizations.audiobooks(organizationId, page),
      queryFn: () => getOrganizationAudiobooks(organizationId, page),
      enabled,
      retry: shouldRetryQuery,
      meta: { silent404: true },
   });
}
