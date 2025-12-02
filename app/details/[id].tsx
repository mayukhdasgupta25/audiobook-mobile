import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   Platform,
   FlatList,
   ActivityIndicator,
   TouchableOpacity,
   Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useSelector } from 'react-redux';
import { useQueries } from '@tanstack/react-query';
import { RootState } from '@/store';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Chapter, getChapters, initializePlaybackSession } from '@/services/audiobooks';
import { useAudiobook } from '@/hooks/useAudiobook';
import { useStreamingPlaylist } from '@/hooks/useStreamingPlaylist';
import { ChapterListItem } from '@/components/ChapterListItem';
import { formatDuration } from '@/utils/duration';
import { apiConfig } from '@/services/api';
import { useDispatch } from 'react-redux';
import { setChapter, setTotalDuration, play } from '@/store/player';

export default function DetailsScreen() {
   const { id, autoPlay } = useLocalSearchParams<{ id: string; autoPlay?: string }>();
   const [currentPage, setCurrentPage] = useState(1);
   const insets = useSafeAreaInsets();
   const [allChapters, setAllChapters] = useState<Chapter[]>([]);
   const [pagination, setPagination] = useState<{
      hasNextPage: boolean;
      currentPage: number;
      totalPages: number;
   } | null>(null);
   const paginationLoadingRef = useRef(false);
   const clickedChapterIdRef = useRef<string | null>(null);
   const dispatch = useDispatch();
   const [isMetaExpanded, setIsMetaExpanded] = useState(false);
   const metaAnimationHeight = useRef(new Animated.Value(0)).current;

   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   // Get player visibility state to calculate proper padding and for "Now Playing" badge
   const isPlayerVisible = useSelector(
      (state: RootState) => state.player.isVisible
   );

   // Calculate scroll content padding based on player visibility and safe area insets
   const scrollContentStyle = useMemo(() => {
      // Account for: bottom nav bar (90/70) + minimized player (~70) + safe area + extra spacing
      // When player is visible, add extra padding for minimized player height
      const basePadding = isPlayerVisible
         ? Platform.OS === 'ios' ? 170 : 150 // Tab bar + minimized player + spacing
         : Platform.OS === 'ios' ? 100 : 80; // Just tab bar when player not visible

      // Add safe area bottom inset to ensure content is accessible
      const paddingBottom = basePadding + (insets?.bottom || 0) + 20; // Extra 20px for spacing

      return {
         paddingBottom,
      };
   }, [isPlayerVisible, insets]);

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

   // Get current playing chapter ID and playing state
   const currentPlayingChapterId = useSelector(
      (state: RootState) => state.player.currentChapterId
   );
   const isPlaying = useSelector(
      (state: RootState) => state.player.isPlaying
   );
   const audiobookId = useSelector(
      (state: RootState) => state.player.audiobookId
   );
   const user = useSelector((state: RootState) => state.auth.user);

   // Track last initialized chapter to prevent duplicate API calls
   const lastInitializedChapterRef = useRef<string | null>(null);

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

            // Initialize playback session when playback starts
            if (
               user?.id &&
               audiobookId &&
               currentPlayingChapterId &&
               lastInitializedChapterRef.current !== currentPlayingChapterId
            ) {
               lastInitializedChapterRef.current = currentPlayingChapterId;
               initializePlaybackSession({
                  userId: user.id,
                  audiobookId,
                  chapterId: currentPlayingChapterId,
               }).catch((error: unknown) => {
                  // Log error but don't block playback
                  console.error('[Details Screen] Failed to initialize playback session:', error);
               });
            }

            // Note: Initial sync on play is handled by usePlaybackSync hook (1 second delay)
            // No need to sync immediately here
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

         // Set current chapter with metadata and audiobookId
         dispatch(
            setChapter({
               chapterId: chapter.id,
               metadata: {
                  id: chapter.id,
                  title: chapter.title,
                  coverImage: chapter.coverImage,
                  maximizedChapterCoverImage: chapter.maximizedChapterCoverImage || null,
                  minimizedChapterCoverImage: chapter.minimizedChapterCoverImage || null,
               },
               audiobookId: chapter.audiobookId,
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

            // Initialize playback session when playback starts
            if (
               user?.id &&
               chapter.audiobookId &&
               chapter.id &&
               lastInitializedChapterRef.current !== chapter.id
            ) {
               lastInitializedChapterRef.current = chapter.id;
               initializePlaybackSession({
                  userId: user.id,
                  audiobookId: chapter.audiobookId,
                  chapterId: chapter.id,
               }).catch((error: unknown) => {
                  // Log error but don't block playback
                  console.error('[Details Screen] Failed to initialize playback session:', error);
               });
            }

            // Note: Initial sync on play is handled by usePlaybackSync hook (1 second delay)
            // No need to sync immediately here
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

   // Track if auto-play has been triggered to prevent multiple triggers
   const autoPlayTriggeredRef = useRef(false);

   // Auto-play first chapter when autoPlay query param is present
   useEffect(() => {
      // Only auto-play if:
      // 1. autoPlay query param is "true"
      // 2. Chapters are loaded and not loading
      // 3. We have at least one chapter
      // 4. We haven't already triggered auto-play
      // 5. First chapter playlist is available
      if (
         autoPlay === 'true' &&
         !isLoadingChapters &&
         allChapters.length > 0 &&
         !autoPlayTriggeredRef.current &&
         firstChapterId
      ) {
         // Find first chapter (sorted by chapterNumber)
         const sortedChapters = [...allChapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
         const firstChapter = sortedChapters[0];

         if (firstChapter) {
            // Check if playlist is ready for first chapter
            const playlistData = playlistsByChapterId[firstChapter.id];

            if (playlistData) {
               // Mark as triggered to prevent duplicate calls
               autoPlayTriggeredRef.current = true;

               // Automatically play first chapter
               handleChapterPress(firstChapter);
            }
            // If playlist not ready yet, it will be handled by the second useEffect
            // that watches for playlist loading
         }
      }
   }, [
      autoPlay,
      isLoadingChapters,
      allChapters,
      firstChapterId,
      playlistsByChapterId,
      handleChapterPress,
   ]);

   // Also trigger auto-play when playlist becomes available for first chapter
   useEffect(() => {
      if (
         autoPlay === 'true' &&
         !isLoadingChapters &&
         allChapters.length > 0 &&
         !autoPlayTriggeredRef.current &&
         firstChapterId
      ) {
         const sortedChapters = [...allChapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
         const firstChapter = sortedChapters[0];
         const playlistData = playlistsByChapterId[firstChapterId];

         if (firstChapter && playlistData && firstChapter.id === firstChapterId) {
            // Mark as triggered to prevent duplicate calls
            autoPlayTriggeredRef.current = true;

            // Automatically play first chapter
            handleChapterPress(firstChapter);
         }
      }
   }, [autoPlay, isLoadingChapters, allChapters, firstChapterId, playlistsByChapterId, handleChapterPress]);

   // Build full image URL for audiobook cover - use chaptersHeroCoverImage if available, fallback to coverImage
   const audiobookCoverUri = useMemo(() => {
      if (!audiobook) return undefined;
      const imagePath = audiobook.chaptersHeroCoverImage || audiobook.coverImage;
      if (!imagePath) return undefined;
      return `${apiConfig.baseURL}${imagePath}`;
   }, [audiobook]);

   // Format audiobook duration
   const formattedDuration = useMemo(() => {
      if (!audiobook?.duration) return '';
      return formatDuration(audiobook.duration);
   }, [audiobook?.duration]);

   // Render chapter item
   const renderChapterItem = useCallback(
      ({ item }: { item: Chapter }) => (
         <ChapterListItem
            chapter={item}
            onPress={handleChapterPress}
            isCurrentlyPlaying={
               isPlayerVisible &&
               item.id === currentPlayingChapterId &&
               isPlaying
            }
         />
      ),
      [handleChapterPress, currentPlayingChapterId, isPlaying, isPlayerVisible]
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

   // Toggle meta expansion
   const toggleMetaExpansion = useCallback(() => {
      const toValue = isMetaExpanded ? 0 : 1;
      setIsMetaExpanded(!isMetaExpanded);

      Animated.parallel([
         Animated.timing(metaAnimationHeight, {
            toValue,
            duration: 300,
            useNativeDriver: false,
         }),
      ]).start();
   }, [isMetaExpanded, metaAnimationHeight]);

   // Calculate meta content height for animation
   const metaContentHeight = useMemo(() => {
      if (!audiobook?.meta) return 0;
      const entries = Object.entries(audiobook.meta);
      // More accurate height calculation: each entry ~40px + padding
      return entries.length * 40 + spacing.md * 2;
   }, [audiobook?.meta]);

   // Render header with audiobook info
   const renderHeader = useCallback(() => {
      const hasMeta = audiobook?.meta && Object.keys(audiobook.meta).length > 0;
      const metaEntries = hasMeta && audiobook.meta ? Object.entries(audiobook.meta) : [];

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
               {/* Title */}
               {audiobook?.title && (
                  <Text style={styles.audiobookTitle} numberOfLines={2}>
                     {audiobook.title}
                  </Text>
               )}

               {/* Genres Array - Below Title */}
               {audiobook?.genres && audiobook.genres.length > 0 && (
                  <View style={styles.genresContainer}>
                     {audiobook.genres.map((genre, index) => (
                        <View key={index} style={styles.genreChip}>
                           <Text style={styles.genreChipText}>{genre.name}</Text>
                        </View>
                     ))}
                  </View>
               )}

               {/* Author and Duration - Second Row */}
               <View style={styles.metaContainer}>
                  {audiobook?.author && (
                     <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Author:</Text>
                        <Text style={styles.metaValue}>{audiobook.author}</Text>
                     </View>
                  )}
                  {formattedDuration && (
                     <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Duration:</Text>
                        <Text style={styles.metaValue}>{formattedDuration}</Text>
                     </View>
                  )}
               </View>

               {/* Narrators - Above Description */}
               {audiobook?.narrators && audiobook.narrators.length > 0 && (
                  <Text style={styles.narrators}>
                     Narrators: {audiobook.narrators.join(', ')}
                  </Text>
               )}

               {/* Description */}
               {audiobook?.description && (
                  <Text style={styles.description}>{audiobook.description}</Text>
               )}

               {/* Meta Dropdown */}
               {hasMeta && (
                  <View style={styles.metaDropdownContainer}>
                     <TouchableOpacity
                        onPress={toggleMetaExpansion}
                        style={styles.metaDropdownButton}
                        activeOpacity={0.7}
                     >
                        <Text style={styles.metaDropdownButtonText}>See More</Text>
                        <Ionicons
                           name={isMetaExpanded ? 'chevron-up' : 'chevron-down'}
                           size={20}
                           color={colors.text.dark}
                        />
                     </TouchableOpacity>
                     <Animated.View
                        style={[
                           styles.metaContent,
                           {
                              maxHeight: metaAnimationHeight.interpolate({
                                 inputRange: [0, 1],
                                 outputRange: [0, metaContentHeight],
                              }),
                              opacity: metaAnimationHeight.interpolate({
                                 inputRange: [0, 0.5, 1],
                                 outputRange: [0, 0.5, 1],
                              }),
                              transform: [
                                 {
                                    translateY: metaAnimationHeight.interpolate({
                                       inputRange: [0, 1],
                                       outputRange: [-10, 0],
                                    }),
                                 },
                              ],
                           },
                        ]}
                     >
                        {metaEntries.map(([key, value], index) => (
                           <View key={index} style={styles.metaEntry}>
                              <Text style={styles.metaKey}>{key}:</Text>
                              <Text style={styles.metaValueText}>{String(value)}</Text>
                           </View>
                        ))}
                     </Animated.View>
                  </View>
               )}
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
      audiobook?.title,
      audiobook?.genres,
      audiobook?.description,
      audiobook?.author,
      audiobook?.narrators,
      audiobook?.meta,
      formattedDuration,
      isMetaExpanded,
      metaAnimationHeight,
      metaContentHeight,
      toggleMetaExpansion,
   ]);

   // Handle navigation to tabs
   const handleTabNavigation = useCallback((route: string) => {
      if (route === 'home') {
         router.push('/(tabs)');
      } else if (route === 'new-hot') {
         router.push('/(tabs)/new-hot');
      } else if (route === 'profile') {
         router.push('/(tabs)/profile');
      }
   }, []);

   return (
      <>
         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
               contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
            />

            {/* Bottom Navigation Bar */}
            <View style={[
               styles.bottomNavBar,
               {
                  paddingBottom: (Platform.OS === 'ios' ? 30 : 10) + (insets?.bottom || 0),
                  height: (Platform.OS === 'ios' ? 90 : 70) + (insets?.bottom || 0),
               }
            ]}>
               <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleTabNavigation('home')}
                  activeOpacity={0.7}
                  accessibilityLabel="Home"
                  accessibilityRole="button"
               >
                  <Ionicons
                     name="home"
                     size={24}
                     color={colors.text.secondaryDark}
                  />
                  <Text style={styles.navLabel}>Home</Text>
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleTabNavigation('new-hot')}
                  activeOpacity={0.7}
                  accessibilityLabel="New & Hot"
                  accessibilityRole="button"
               >
                  <Ionicons
                     name="flash"
                     size={24}
                     color={colors.text.secondaryDark}
                  />
                  <Text style={styles.navLabel}>New & Hot</Text>
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleTabNavigation('profile')}
                  activeOpacity={0.7}
                  accessibilityLabel="My AudioBook"
                  accessibilityRole="button"
               >
                  <Ionicons
                     name="person-circle-outline"
                     size={24}
                     color={colors.text.secondaryDark}
                  />
                  <Text style={styles.navLabel}>My AudioBook</Text>
               </TouchableOpacity>
            </View>
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
      // Base padding - will be overridden by dynamic padding based on player visibility
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
   },
   titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      gap: spacing.md,
   },
   audiobookTitle: {
      flex: 1,
      fontSize: typography.fontSize.xl,
      color: colors.text.dark,
      fontWeight: '600',
      marginRight: spacing.sm,
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
   genreBanner: {
      backgroundColor: colors.app.red,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
      flexShrink: 0,
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
   genresContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
   },
   genreChip: {
      backgroundColor: colors.app.red,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
   },
   genreChipText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.dark,
      fontWeight: '500',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   narrators: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
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
   metaDropdownContainer: {
      marginTop: spacing.md,
      overflow: 'hidden',
      alignItems: 'center',
      width: '100%',
   },
   metaDropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
      marginBottom: spacing.xs,
      alignSelf: 'center',
   },
   metaDropdownButtonText: {
      fontSize: typography.fontSize.base,
      color: colors.text.dark,
      fontWeight: '500',
      marginRight: spacing.xs,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   metaContent: {
      width: '100%',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      backgroundColor: colors.neutral[800],
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      marginTop: spacing.xs,
   },
   metaEntry: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
      gap: spacing.sm,
   },
   metaKey: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      fontWeight: '600',
      minWidth: 100,
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
   metaValueText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.dark,
      flex: 1,
      textAlign: 'left',
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
   description: {
      fontSize: typography.fontSize.base,
      color: colors.text.dark,
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
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
   bottomNavBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background.darkGray,
      borderTopWidth: 0,
      height: Platform.OS === 'ios' ? 90 : 70,
      paddingTop: Platform.OS === 'ios' ? 10 : 5,
      paddingBottom: Platform.OS === 'ios' ? 30 : 10,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 100, // Below AudioPlayer (zIndex 1000) but above content
      elevation: 100, // Android elevation (below AudioPlayer elevation 1000)
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
         },
         android: {
            elevation: 3,
         },
      }),
   },
   navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
   },
   navLabel: {
      fontSize: typography.fontSize.xs,
      fontWeight: '500',
      marginTop: 4,
      color: colors.text.secondaryDark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
});
