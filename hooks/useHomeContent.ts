/**
 * Main hook for home page content
 * Orchestrates fetching tags, genres, and audiobooks for each
 */

import { useMemo, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQueries } from '@tanstack/react-query';
import { useTags } from './useTags';
import { useGenres } from './useGenres';
import { getAudiobooksByTag, getAudiobooksByGenre } from '@/services/audiobooks';
import { Audiobook, PaginationInfo, AudiobooksResponse } from '@/services/audiobooks';
import { ContentItem } from '@/components/ContentRow';
import { apiConfig } from '@/services/api';
import { RootState } from '@/store';

/**
 * Content row data structure
 */
export interface ContentRowData {
   id: string; // tag name or genre id
   type: 'tag' | 'genre';
   title: string; // tag name or genre name
   items: ContentItem[];
   pagination: PaginationInfo | null;
   isLoading: boolean;
   error: string | null;
}

/**
 * Convert Audiobook to ContentItem format
 */
function audiobookToContentItem(audiobook: Audiobook): ContentItem {
   // Build full image URL by prepending API base URL
   const imageUri = audiobook.coverImage
      ? `${apiConfig.baseURL}${audiobook.coverImage}`
      : undefined;

   // Extract badge from tags (e.g., "TOP 10" from trending tag)
   const badge = audiobook.audiobookTags.find((tag) => tag.name.includes('TOP'))
      ?.name || undefined;

   return {
      id: audiobook.id,
      title: audiobook.title,
      imageUri,
      badge,
   };
}

/**
 * Main hook for home page content
 * @returns Object with content rows, loading state, error, and loadNextPage function
 */
export function useHomeContent() {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   // Track current page for each row
   const [rowPages, setRowPages] = useState<Record<string, number>>({});
   const paginationLoadingRef = useRef<Record<string, boolean>>({});

   // Fetch tags and genres
   const {
      data: tagsData,
      isLoading: tagsLoading,
      error: tagsError,
   } = useTags();
   const {
      data: genresData,
      isLoading: genresLoading,
      error: genresError,
   } = useGenres();

   // Get first 2 tags for content rows, sorted so Trending comes before New Releases
   const tags = useMemo(() => {
      const allTags = tagsData?.data || [];
      // Sort tags: Trending first, then New Releases, then others
      const sortedTags = [...allTags].sort((a, b) => {
         const aName = a.name.toLowerCase();
         const bName = b.name.toLowerCase();

         // Trending comes first
         if (aName.includes('trending') && !bName.includes('trending')) return -1;
         if (!aName.includes('trending') && bName.includes('trending')) return 1;

         // New Releases comes after Trending
         if (aName.includes('new') && aName.includes('release') && !bName.includes('trending')) return -1;
         if (!aName.includes('new') && !aName.includes('release') && bName.includes('new') && bName.includes('release')) return 1;

         // Keep original order for others
         return 0;
      });
      return sortedTags.slice(0, 2);
   }, [tagsData]);

   // Get all genres for content rows
   const genres = useMemo(() => {
      return genresData?.data || [];
   }, [genresData]);

   // Build query options for tags - fetch all pages up to current page
   const tagQueryOptions = useMemo(() => {
      const options: {
         queryKey: unknown[];
         queryFn: () => Promise<AudiobooksResponse>;
         enabled: boolean;
         staleTime: number;
      }[] = [];
      tags.forEach((tag) => {
         const currentPage = rowPages[`tag-${tag.name}`] || 1;
         // Fetch all pages from 1 to currentPage
         for (let page = 1; page <= currentPage; page++) {
            options.push({
               queryKey: ['audiobooks', 'tag', tag.name, page],
               queryFn: () => getAudiobooksByTag(tag.name, page),
               enabled: !!tag.name && isAuthenticated && isInitialized && page > 0,
               staleTime: 5 * 60 * 1000,
            });
         }
      });
      return options;
   }, [tags, rowPages, isAuthenticated, isInitialized]);

   // Build query options for genres - fetch all pages up to current page
   const genreQueryOptions = useMemo(() => {
      const options: {
         queryKey: unknown[];
         queryFn: () => Promise<AudiobooksResponse>;
         enabled: boolean;
         staleTime: number;
      }[] = [];
      genres.forEach((genre) => {
         const currentPage = rowPages[`genre-${genre.id}`] || 1;
         // Fetch all pages from 1 to currentPage
         for (let page = 1; page <= currentPage; page++) {
            options.push({
               queryKey: ['audiobooks', 'genre', genre.id, page],
               queryFn: () => getAudiobooksByGenre(genre.id, page),
               enabled: !!genre.id && isAuthenticated && isInitialized && page > 0,
               staleTime: 5 * 60 * 1000,
            });
         }
      });
      return options;
   }, [genres, rowPages, isAuthenticated, isInitialized]);

   // Fetch audiobooks for each tag using useQueries
   const tagQueries = useQueries({
      queries: tagQueryOptions,
   });

   // Fetch audiobooks for each genre using useQueries
   const genreQueries = useQueries({
      queries: genreQueryOptions,
   });

   // Note: 401 errors are handled globally by TanStack Query's onError handler
   // and by the API service layer, so no need to handle them here

   // Build content rows data - combine all pages for each row
   const contentRows = useMemo((): ContentRowData[] => {
      const rows: ContentRowData[] = [];
      let queryIndex = 0;

      // Add tag rows (first 2 tags)
      tags.forEach((tag) => {
         const currentPage = rowPages[`tag-${tag.name}`] || 1;
         const allAudiobooks: Audiobook[] = [];
         let pagination: PaginationInfo | null = null;
         let isLoading = false;
         let error: string | null = null;

         // Combine all pages for this tag
         for (let page = 1; page <= currentPage; page++) {
            const query = tagQueries[queryIndex];
            if (query.data?.data) {
               allAudiobooks.push(...query.data.data);
               // Use pagination from the latest page
               if (query.data.pagination) {
                  pagination = query.data.pagination;
               }
            }
            if (query.isLoading) {
               isLoading = true;
            }
            if (query.error) {
               error = query.error instanceof Error ? query.error.message : 'Failed to load audiobooks';
            }
            queryIndex++;
         }

         // Remove duplicates by id
         const uniqueAudiobooks = allAudiobooks.filter(
            (book, index, self) => index === self.findIndex((b) => b.id === book.id)
         );

         rows.push({
            id: `tag-${tag.name}`,
            type: 'tag',
            title: tag.name,
            items: uniqueAudiobooks.map(audiobookToContentItem),
            pagination,
            isLoading,
            error,
         });
      });

      // Reset query index for genres
      queryIndex = 0;

      // Add genre rows (only if they have data)
      genres.forEach((genre) => {
         const currentPage = rowPages[`genre-${genre.id}`] || 1;
         const allAudiobooks: Audiobook[] = [];
         let pagination: PaginationInfo | null = null;
         let isLoading = false;
         let error: string | null = null;

         // Combine all pages for this genre
         for (let page = 1; page <= currentPage; page++) {
            const query = genreQueries[queryIndex];
            if (query.data?.data) {
               allAudiobooks.push(...query.data.data);
               // Use pagination from the latest page
               if (query.data.pagination) {
                  pagination = query.data.pagination;
               }
            }
            if (query.isLoading) {
               isLoading = true;
            }
            if (query.error) {
               error = query.error instanceof Error ? query.error.message : 'Failed to load audiobooks';
            }
            queryIndex++;
         }

         // Remove duplicates by id
         const uniqueAudiobooks = allAudiobooks.filter(
            (book, index, self) => index === self.findIndex((b) => b.id === book.id)
         );

         // Only add genre row if it has items (don't show empty genres)
         // Also allow if still loading (to show loading state)
         if (uniqueAudiobooks.length > 0 || isLoading) {
            rows.push({
               id: `genre-${genre.id}`,
               type: 'genre',
               title: genre.name,
               items: uniqueAudiobooks.map(audiobookToContentItem),
               pagination,
               isLoading,
               error,
            });
         }
      });

      return rows;
   }, [tags, genres, tagQueries, genreQueries, rowPages]);

   /**
    * Load next page for a specific row
    * @param rowId - Row identifier (e.g., "tag-New Releases" or "genre-{id}")
    */
   const loadNextPage = useCallback(
      (rowId: string) => {
         // Prevent duplicate pagination requests
         if (paginationLoadingRef.current[rowId]) {
            return;
         }

         const row = contentRows.find((r) => r.id === rowId);
         if (!row || !row.pagination?.hasNextPage) {
            return;
         }

         // Check if any query for this row is currently loading
         const rowIndex = row.type === 'tag'
            ? tags.findIndex((t) => `tag-${t.name}` === rowId)
            : genres.findIndex((g) => `genre-${g.id}` === rowId);

         const isAnyLoading = row.type === 'tag'
            ? tagQueries[rowIndex]?.isLoading
            : genreQueries[rowIndex]?.isLoading;

         if (isAnyLoading) {
            return;
         }

         paginationLoadingRef.current[rowId] = true;
         const currentPage = rowPages[rowId] || 1;
         const nextPage = currentPage + 1;

         setRowPages((prev) => ({
            ...prev,
            [rowId]: nextPage,
         }));

         // Reset loading flag after query completes
         setTimeout(() => {
            paginationLoadingRef.current[rowId] = false;
         }, 1000);
      },
      [contentRows, rowPages, tags, genres, tagQueries, genreQueries]
   );

   // Overall loading state
   const isLoading = tagsLoading || genresLoading || contentRows.some((row) => row.isLoading);

   // Overall error state
   const error = tagsError || genresError || contentRows.find((row) => row.error)?.error || null;

   return {
      contentRows,
      isLoading,
      error,
      loadNextPage,
   };
}

