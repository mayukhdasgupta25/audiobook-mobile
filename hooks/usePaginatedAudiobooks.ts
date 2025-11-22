/**
 * Custom hook for paginated audiobooks
 * Combines TanStack Query for fetching with Redux for state management
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAudiobooks } from './useAudiobooks';
import {
   setAudiobooks,
   appendAudiobooks,
   clearAudiobooks,
   setLoading,
   setError,
} from '@/store/audiobooks';
import { RootState } from '@/store';
import { ApiError } from '@/services/api';
import { AudiobooksResponse } from '@/services/audiobooks';

/**
 * Hook for managing paginated audiobooks
 * @returns Object with audiobooks organized by tag, loading state, error, pagination info, and loadNextPage function
 */
export function usePaginatedAudiobooks() {
   const dispatch = useDispatch();
   const [currentPage, setCurrentPage] = useState(1);
   const isLoadingRef = useRef(false);
   const lastProcessedDataRef = useRef<AudiobooksResponse | null>(null);
   const lastProcessedPageRef = useRef<number>(0);

   // Get current state from Redux
   const { audiobooksByTag, pagination, isLoading, error } = useSelector(
      (state: RootState) => state.audiobooks
   );
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );

   // Reset to page 1 and clear data when user logs out
   const hasClearedOnLogoutRef = useRef(false);
   const lastAuthStateRef = useRef<boolean | null>(null);
   useEffect(() => {
      // Only run when authentication state actually changes
      if (lastAuthStateRef.current === isAuthenticated) {
         return;
      }
      lastAuthStateRef.current = isAuthenticated;

      if (!isAuthenticated) {
         if (currentPage !== 1) {
            setCurrentPage(1);
         }
         // Clear audiobooks data when user is not authenticated (only once)
         if (!hasClearedOnLogoutRef.current) {
            dispatch(clearAudiobooks());
            hasClearedOnLogoutRef.current = true;
         }
         lastProcessedDataRef.current = null;
         lastProcessedPageRef.current = 0;
         isLoadingRef.current = false;
      } else {
         // Reset the flag when user is authenticated again
         hasClearedOnLogoutRef.current = false;
      }
   }, [isAuthenticated, currentPage, dispatch]);

   // Fetch current page using TanStack Query
   const { data, isLoading: queryLoading, error: queryError } = useAudiobooks(currentPage);

   // Update Redux state when data is fetched
   // Only process if data has actually changed or page changed
   useEffect(() => {
      if (data && (data !== lastProcessedDataRef.current || currentPage !== lastProcessedPageRef.current)) {
         // Check if this is the same data we've already processed
         const isSameData =
            lastProcessedDataRef.current &&
            lastProcessedDataRef.current.data.length === data.data.length &&
            lastProcessedDataRef.current.pagination.currentPage === data.pagination.currentPage &&
            lastProcessedPageRef.current === currentPage;

         if (!isSameData) {
            if (currentPage === 1) {
               // First page - set initial data
               dispatch(
                  setAudiobooks({
                     audiobooks: data.data,
                     pagination: data.pagination,
                  })
               );
            } else {
               // Subsequent pages - append data
               dispatch(
                  appendAudiobooks({
                     audiobooks: data.data,
                     pagination: data.pagination,
                  })
               );
            }
            lastProcessedDataRef.current = data;
            lastProcessedPageRef.current = currentPage;
            isLoadingRef.current = false;
         }
      }
   }, [data, currentPage, dispatch]);

   // Update loading state - only dispatch if state actually changed
   const lastLoadingStateRef = useRef<boolean | null>(null);
   useEffect(() => {
      if (lastLoadingStateRef.current !== queryLoading) {
         dispatch(setLoading(queryLoading));
         lastLoadingStateRef.current = queryLoading;
      }
   }, [queryLoading, dispatch]);

   // Handle errors - only process once per error
   // Note: 401 errors are handled globally by the API service layer
   const lastErrorRef = useRef<Error | null>(null);
   useEffect(() => {
      if (queryError && queryError !== lastErrorRef.current) {
         lastErrorRef.current = queryError;
         // Skip 401 errors - they're handled globally
         if (queryError instanceof ApiError && queryError.status === 401) {
            isLoadingRef.current = false;
            return;
         }
         // Handle other errors
         const errorMessage =
            queryError instanceof Error
               ? queryError.message
               : 'Failed to load audiobooks';
         dispatch(setError(errorMessage));
         isLoadingRef.current = false;
      }
   }, [queryError, dispatch]);

   /**
    * Load next page of audiobooks
    * Only loads if there's a next page and not already loading
    */
   const loadNextPage = useCallback(() => {
      if (
         pagination?.hasNextPage &&
         !isLoadingRef.current &&
         !queryLoading &&
         currentPage < (pagination?.totalPages || 1)
      ) {
         isLoadingRef.current = true;
         setCurrentPage((prev) => prev + 1);
      }
   }, [pagination, queryLoading, currentPage]);

   return {
      audiobooksByTag,
      pagination,
      isLoading: isLoading || queryLoading,
      error,
      loadNextPage,
   };
}

