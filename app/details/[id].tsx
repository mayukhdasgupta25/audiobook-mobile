import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   Platform,
   FlatList,
   ActivityIndicator,
   TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useSelector } from 'react-redux';
import { useQueries } from '@tanstack/react-query';
import { RootState } from '@/store';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Chapter, getChapters } from '@/services/audiobooks';
import { useAudiobook } from '@/hooks/useAudiobook';
import { useStreamingPlaylist } from '@/hooks/useStreamingPlaylist';
import { ChapterListItem } from '@/components/ChapterListItem';
import { formatDuration } from '@/utils/duration';
import { apiConfig } from '@/services/api';
import { useDispatch } from 'react-redux';
import { setChapter, setTotalDuration, play } from '@/store/player';

export default function DetailsScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const [currentPage, setCurrentPage] = useState(1);
   const [allChapters, setAllChapters] = useState<Chapter[]>([]);
   const [pagination, setPagination] = useState<{
      hasNextPage: boolean;
      currentPage: number;
      totalPages: number;
   } | null>(null);
   const paginationLoadingRef = useRef(false);
   const clickedChapterIdRef = useRef<string | null>(null);
   const dispatch = useDispatch();

   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   // Fetch audiobook data
   const { data: audiobookData, isLoading: audiobookLoading } = useAudiobook(id || '');

   const audiobook = audiobookData?.data;

   // Create query options for all pages up to currentPage
   const chapterQueryOptions = useMemo(() => {
      if (!id || !isAuthenticated || !isInitialized) {
         return [];
      }

      const options = [];
      for (let page = 1; page <= currentPage; page++) {
         options.push({
            queryKey: ['chapters', id, page],
            queryFn: () => getChapters(id, page),
            enabled: true,
         });
      }
      return options;
   }, [id, currentPage, isAuthenticated, isInitialized]);

   // Fetch chapters for all pages
   const chapterQueries = useQueries({
      queries: chapterQueryOptions,
   });

   // Track last processed data to prevent infinite loops
   const lastProcessedDataRef = useRef<{
      chapterIds: Set<string>;
      pagination: { hasNextPage: boolean; currentPage: number; totalPages: number } | null;
   }>({ chapterIds: new Set(), pagination: null });

   // Combine all chapters from all pages and sort by chapterNumber
   useEffect(() => {
      const chapters: Chapter[] = [];
      let latestPagination: { hasNextPage: boolean; currentPage: number; totalPages: number } | null = null;

      chapterQueries.forEach((query) => {
         if (query.data?.data) {
            chapters.push(...query.data.data);
            if (query.data.pagination) {
               latestPagination = {
                  hasNextPage: query.data.pagination.hasNextPage,
                  currentPage: query.data.pagination.currentPage,
                  totalPages: query.data.pagination.totalPages,
               };
            }
         }
      });

      // Remove duplicates by id
      const uniqueChapters = chapters.filter(
         (chapter, index, self) =>
            index === self.findIndex((c) => c.id === chapter.id)
      );

      // Sort by chapterNumber
      uniqueChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

      // Check if data actually changed by comparing chapter IDs
      const currentChapterIds = new Set(uniqueChapters.map((c) => c.id));
      const lastChapterIds = lastProcessedDataRef.current.chapterIds;

      // Check if sets are different
      let paginationChanged = false;
      if (latestPagination !== null) {
         const pag = latestPagination as { hasNextPage: boolean; currentPage: number; totalPages: number };
         const lastPagination = lastProcessedDataRef.current.pagination;
         paginationChanged =
            pag.hasNextPage !== (lastPagination?.hasNextPage ?? false) ||
            pag.currentPage !== (lastPagination?.currentPage ?? 0);
      }

      const hasChanged =
         currentChapterIds.size !== lastChapterIds.size ||
         !Array.from(currentChapterIds).every((id) => lastChapterIds.has(id)) ||
         paginationChanged;

      // Only update state if data actually changed
      if (hasChanged) {
         setAllChapters(uniqueChapters);
         if (latestPagination) {
            setPagination(latestPagination);
            lastProcessedDataRef.current = {
               chapterIds: currentChapterIds,
               pagination: latestPagination,
            };
         } else {
            lastProcessedDataRef.current = {
               chapterIds: currentChapterIds,
               pagination: null,
            };
         }
      }
   }, [chapterQueries]);

   // Check loading state
   const isLoadingChapters = chapterQueries.some((query) => query.isLoading);
   const chaptersError = chapterQueries.find((query) => query.error);

   // Get first chapter ID for streaming playlist
   const firstChapterId = useMemo(() => {
      if (allChapters.length > 0) {
         // Sort by chapterNumber to ensure we get the first chapter
         const sortedChapters = [...allChapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
         return sortedChapters[0]?.id || null;
      }
      return null;
   }, [allChapters]);

   // Fetch streaming playlist for first chapter after chapters have loaded
   // This pre-fetches master playlist and playlist data for the first chapter
   useStreamingPlaylist(firstChapterId, !!firstChapterId && allChapters.length > 0);

   // Get playlists from Redux to check if playlist is loaded
   const playlistsByChapterId = useSelector(
      (state: RootState) => state.streaming.playlistsByChapterId
   );

   // Get current playing chapter ID to fetch its playlist if needed
   const currentPlayingChapterId = useSelector(
      (state: RootState) => state.player.currentChapterId
   );

   // Fetch playlist for currently playing chapter if not already loaded
   // This ensures playlist is fetched when user clicks a chapter
   const { data: currentChapterPlaylist } = useStreamingPlaylist(
      currentPlayingChapterId,
      !!currentPlayingChapterId && !playlistsByChapterId[currentPlayingChapterId]
   );

   // Set total duration and auto-play when playlist loads for clicked chapter
   useEffect(() => {
      if (
         currentPlayingChapterId &&
         currentChapterPlaylist &&
         playlistsByChapterId[currentPlayingChapterId]
      ) {
         const playlistData = playlistsByChapterId[currentPlayingChapterId];
         // Calculate total duration from segments
         const totalDuration = playlistData.playlist.segments.reduce(
            (sum: number, segment: { duration: number }) => sum + segment.duration,
            0
         );
         dispatch(setTotalDuration(totalDuration));

         // Auto-play only if this chapter was clicked by the user
         if (clickedChapterIdRef.current === currentPlayingChapterId) {
            dispatch(play());
            // Reset the ref after starting playback
            clickedChapterIdRef.current = null;
         }
      }
   }, [currentPlayingChapterId, currentChapterPlaylist, playlistsByChapterId, dispatch]);

   useEffect(() => {
      if (isInitialized && !isAuthenticated) {
         router.replace('/signin');
      }
   }, [isAuthenticated, isInitialized]);

   // Load next page when user scrolls to bottom
   const loadNextPage = useCallback(() => {
      if (
         pagination?.hasNextPage &&
         !paginationLoadingRef.current &&
         !isLoadingChapters &&
         currentPage < (pagination.totalPages || 1)
      ) {
         paginationLoadingRef.current = true;
         setCurrentPage((prev) => {
            const nextPage = prev + 1;
            // Reset loading flag after query completes
            setTimeout(() => {
               paginationLoadingRef.current = false;
            }, 1000);
            return nextPage;
         });
      }
   }, [pagination, isLoadingChapters, currentPage]);

   // Handle back button press
   const handleBack = useCallback(() => {
      router.back();
   }, []);

   // Handle chapter press
   const handleChapterPress = useCallback(
      (chapter: Chapter) => {
         // Track that user clicked this chapter (for auto-play)
         clickedChapterIdRef.current = chapter.id;

         // Set current chapter with metadata
         dispatch(
            setChapter({
               chapterId: chapter.id,
               metadata: {
                  id: chapter.id,
                  title: chapter.title,
                  coverImage: chapter.coverImage,
               },
            })
         );

         // Get playlist data from Redux (might not be loaded yet)
         const playlistData = playlistsByChapterId[chapter.id];

         if (playlistData) {
            // Calculate total duration from segments
            const totalDuration = playlistData.playlist.segments.reduce(
               (sum: number, segment: { duration: number }) => sum + segment.duration,
               0
            );
            dispatch(setTotalDuration(totalDuration));
            // Start playback automatically when user clicks on chapter
            dispatch(play());
         } else {
            // Playlist will be fetched by useStreamingPlaylist hook
            // Playback will start automatically when playlist loads
            console.log(
               '[Details Screen] Playlist not loaded yet, will fetch for chapter:',
               chapter.id
            );
         }
      },
      [dispatch, playlistsByChapterId]
   );

   // Build full image URL for audiobook cover
   const audiobookCoverUri = useMemo(() => {
      if (!audiobook?.coverImage) return undefined;
      return `${apiConfig.baseURL}${audiobook.coverImage}`;
   }, [audiobook?.coverImage]);

   // Format audiobook duration
   const formattedDuration = useMemo(() => {
      if (!audiobook?.duration) return '';
      return formatDuration(audiobook.duration);
   }, [audiobook?.duration]);

   // Render chapter item
   const renderChapterItem = useCallback(
      ({ item }: { item: Chapter }) => (
         <ChapterListItem chapter={item} onPress={handleChapterPress} />
      ),
      [handleChapterPress]
   );

   // Render footer with loading indicator
   const renderFooter = useCallback(() => {
      if (!isLoadingChapters || !pagination?.hasNextPage) {
         return null;
      }
      return (
         <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={colors.app.red} />
         </View>
      );
   }, [isLoadingChapters, pagination]);

   // Render empty state
   const renderEmpty = useCallback(() => {
      if (isLoadingChapters) {
         return (
            <View style={styles.emptyContainer}>
               <ActivityIndicator size="large" color={colors.app.red} />
               <Text style={styles.emptyText}>Loading chapters...</Text>
            </View>
         );
      }

      if (chaptersError) {
         return (
            <View style={styles.emptyContainer}>
               <Text style={styles.errorText}>
                  {chaptersError instanceof Error
                     ? chaptersError.message
                     : 'Failed to load chapters'}
               </Text>
            </View>
         );
      }

      return (
         <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chapters available</Text>
         </View>
      );
   }, [isLoadingChapters, chaptersError]);

   // Render header with audiobook info
   const renderHeader = useCallback(() => {
      return (
         <>
            {/* Audiobook Cover Image */}
            {audiobookCoverUri ? (
               <View style={styles.coverContainer}>
                  <Image
                     source={{ uri: audiobookCoverUri }}
                     style={styles.coverImage}
                     contentFit="cover"
                     transition={200}
                     cachePolicy="memory-disk"
                  />
               </View>
            ) : audiobookLoading ? (
               <View style={styles.coverContainer}>
                  <View style={[styles.coverImage, styles.coverPlaceholder]}>
                     <ActivityIndicator size="large" color={colors.app.red} />
                  </View>
               </View>
            ) : null}

            {/* Audiobook Info Section */}
            <View style={styles.infoSection}>
               {/* Genre Banner - Top Right Corner */}
               {audiobook?.genre?.name && (
                  <View style={styles.genreBanner}>
                     <Text style={styles.genreText}>{audiobook.genre.name}</Text>
                  </View>
               )}

               {/* Description */}
               {audiobook?.description && (
                  <Text style={styles.description}>{audiobook.description}</Text>
               )}

               {/* Duration and Author */}
               <View style={styles.metaContainer}>
                  {formattedDuration ? (
                     <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Duration:</Text>
                        <Text style={styles.metaValue}>{formattedDuration}</Text>
                     </View>
                  ) : null}
                  {audiobook?.author && (
                     <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Author:</Text>
                        <Text style={styles.metaValue}>{audiobook.author}</Text>
                     </View>
                  )}
               </View>
            </View>

            {/* Chapters Title */}
            <View style={styles.chaptersSection}>
               <Text style={styles.chaptersTitle}>Chapters</Text>
            </View>
         </>
      );
   }, [
      audiobookCoverUri,
      audiobookLoading,
      audiobook?.genre?.name,
      audiobook?.description,
      audiobook?.author,
      formattedDuration,
   ]);

   return (
      <>
         <SafeAreaView style={styles.container} edges={['top']}>
            {/* Back Button - Fixed at top, overlaying content */}
            <View style={styles.backButtonContainer}>
               <TouchableOpacity
                  onPress={handleBack}
                  style={styles.backButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
               >
                  <Ionicons
                     name="chevron-back"
                     size={28}
                     color={colors.text.dark}
                  />
               </TouchableOpacity>
            </View>

            <FlatList
               data={allChapters}
               renderItem={renderChapterItem}
               keyExtractor={(item) => item.id}
               ListHeaderComponent={renderHeader}
               ListEmptyComponent={renderEmpty}
               ListFooterComponent={renderFooter}
               onEndReached={loadNextPage}
               onEndReachedThreshold={0.5}
               removeClippedSubviews={true}
               showsVerticalScrollIndicator={false}
               contentContainerStyle={styles.scrollContent}
            />
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
   },
   scrollContent: {
      paddingBottom: spacing.xl,
   },
   backButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
   },
   backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
         },
         android: {
            elevation: 5,
         },
      }),
   },
   coverContainer: {
      width: '100%',
      height: 300,
      backgroundColor: colors.background.darkGray,
   },
   coverImage: {
      width: '100%',
      height: '100%',
   },
   coverPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
   },
   infoSection: {
      padding: spacing.lg,
      backgroundColor: colors.background.dark,
      position: 'relative',
   },
   genreBanner: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      backgroundColor: colors.app.red,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
   },
   genreText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.dark,
      fontWeight: '600',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   description: {
      fontSize: typography.fontSize.base,
      color: colors.text.dark,
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
      marginBottom: spacing.md,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   metaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
   },
   metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
   },
   metaLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   metaValue: {
      fontSize: typography.fontSize.sm,
      color: colors.text.dark,
      fontWeight: '600',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   chaptersSection: {
      backgroundColor: colors.background.dark,
      paddingTop: spacing.md,
   },
   chaptersTitle: {
      fontSize: typography.fontSize.xl,
      fontWeight: '600',
      color: colors.text.dark,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      letterSpacing: -0.3,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   emptyContainer: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
   },
   emptyText: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      textAlign: 'center',
      marginTop: spacing.md,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   errorText: {
      fontSize: typography.fontSize.base,
      color: colors.app.red,
      textAlign: 'center',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   footerLoader: {
      padding: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
   },
});
