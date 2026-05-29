import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   Platform,
   FlatList,
   ScrollView,
   ActivityIndicator,
   TouchableOpacity,
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
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { TabUnderline } from '@/components/TabUnderline';
import { TabSlideView } from '@/components/TabSlideView';
import { formatDuration } from '@/utils/duration';
import { apiConfig } from '@/services/api';
import { useDispatch } from 'react-redux';
import { setTotalDuration, play } from '@/store/player';
import { useChaptersProgress } from '@/hooks/useChaptersProgress';
import { openChapterForPlayback } from '@/utils/openChapterForPlayback';
import { requestChapterReload } from '@/services/playbackReload';
import { getMinimizedPlayerScrollPadding } from '@/theme/tabLayout';

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
   const [detailTab, setDetailTab] = useState<'chapters' | 'about'>('chapters');
   const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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

   // Scroll padding: details has no tab bar; add space only for minimized player when visible
   const scrollContentStyle = useMemo(() => {
      const paddingBottom = isPlayerVisible
         ? getMinimizedPlayerScrollPadding(insets.bottom)
         : insets.bottom + spacing.lg;

      return { paddingBottom };
   }, [isPlayerVisible, insets.bottom]);

   // Fetch audiobook data
   const { data: audiobookData } = useAudiobook(id || '');

   const audiobook = audiobookData?.data;

   const isAccessRestricted = audiobook?.subscriptionAccess?.canAccess === false;
   const shouldFetchChapters = !!audiobook && !isAccessRestricted;

   const upgradeMessage = audiobook?.subscriptionAccess?.message;

   // Create query options for all pages up to currentPage
   const chapterQueryOptions = useMemo(() => {
      if (!id || !isAuthenticated || !isInitialized || !shouldFetchChapters) {
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
   }, [id, currentPage, isAuthenticated, isInitialized, shouldFetchChapters]);

   // Fetch chapters for all pages
   const chapterQueries = useQueries({
      queries: chapterQueryOptions,
   });

   // Track last processed data to prevent infinite loops
   const lastProcessedDataRef = useRef<{
      chapterIds: Set<string>;
      pagination: { hasNextPage: boolean; currentPage: number; totalPages: number } | null;
   }>({ chapterIds: new Set(), pagination: null });

   // Clear chapter list when subscription does not allow access
   useEffect(() => {
      if (isAccessRestricted) {
         setAllChapters([]);
         setPagination(null);
         lastProcessedDataRef.current = { chapterIds: new Set(), pagination: null };
      }
   }, [isAccessRestricted]);

   // Combine all chapters from all pages and sort by chapterNumber
   useEffect(() => {
      if (!shouldFetchChapters) {
         return;
      }

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
   }, [chapterQueries, shouldFetchChapters]);

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
   useStreamingPlaylist(
      firstChapterId,
      shouldFetchChapters && !!firstChapterId && allChapters.length > 0
   );

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

   const chapterIds = useMemo(
      () => allChapters.map((chapter) => chapter.id),
      [allChapters]
   );
   useChaptersProgress(
      chapterIds,
      shouldFetchChapters && allChapters.length > 0
   );

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
         shouldFetchChapters &&
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
   }, [shouldFetchChapters, pagination, isLoadingChapters, currentPage]);

   const handleCommentsPress = useCallback(
      (chapter: Chapter) => {
         router.push({
            pathname: '/chapter-comments',
            params: {
               audiobookId: id ?? '',
               chapterId: chapter.id,
               chapterTitle: chapter.title,
               chapterNumber: String(chapter.chapterNumber),
            },
         } as never);
      },
      [id]
   );

   // Handle back button press
   const handleBack = useCallback(() => {
      router.back();
   }, []);

   const handleUpgradePlanPress = useCallback(() => {
      router.push('/subscription-plans');
   }, []);

   // Handle chapter press
   const handleChapterPress = useCallback(
      async (chapter: Chapter) => {
         clickedChapterIdRef.current = chapter.id;

         const playlistData = playlistsByChapterId[chapter.id];
         const totalDurationSeconds = playlistData
            ? playlistData.playlist.segments.reduce(
                 (sum: number, segment: { duration: number }) => sum + segment.duration,
                 0
              )
            : undefined;

         await openChapterForPlayback({
            chapter,
            dispatch,
            totalDurationSeconds,
            totalChapters: allChapters.length,
            autoPlay: !!playlistData,
         });

         requestChapterReload();

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
               console.error('[Details Screen] Failed to initialize playback session:', error);
            });
         }

         if (!playlistData) {
            console.log(
               '[Details Screen] Playlist not loaded yet, will fetch for chapter:',
               chapter.id
            );
         }
      },
      [dispatch, playlistsByChapterId, user?.id]
   );

   const handlePlayAll = useCallback(() => {
      if (allChapters.length > 0) {
         const sorted = [...allChapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
         void handleChapterPress(sorted[0]);
      }
   }, [allChapters, handleChapterPress]);

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

   // Format audiobook duration
   const formattedDuration = useMemo(() => {
      if (!audiobook?.duration) return '';
      return formatDuration(audiobook.duration);
   }, [audiobook?.duration]);

   // Render chapter item
   const renderChapterItem = useCallback(
      ({ item }: { item: Chapter }) => {
         const isActiveChapter = item.id === currentPlayingChapterId;

         return (
            <ChapterListItem
               chapter={item}
               onPress={(chapter) => {
                  void handleChapterPress(chapter);
               }}
               isCurrentlyPlaying={
                  isPlayerVisible &&
                  item.id === currentPlayingChapterId &&
                  isPlaying
               }
               isActive={isActiveChapter}
               onDownloadPress={() => {}}
            />
         );
      },
      [
         handleChapterPress,
         currentPlayingChapterId,
         isPlaying,
         isPlayerVisible,
      ]
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
      if (isAccessRestricted) {
         return null;
      }

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
   }, [isAccessRestricted, isLoadingChapters, chaptersError]);

   const handleDetailTabPress = useCallback((key: string) => {
      setDetailTab(key as 'chapters' | 'about');
   }, []);

   const renderAboutContent = useCallback(() => {
      if (!audiobook) {
         return null;
      }

      return (
         <View style={styles.aboutSection}>
            {audiobook.narrators?.length ? (
               <Text style={styles.aboutText}>
                  Narrators: {audiobook.narrators.join(', ')}
               </Text>
            ) : null}
            {audiobook.genres?.map((genre, index) => (
               <Text key={index} style={styles.aboutText}>
                  {genre.name}
               </Text>
            ))}
            {audiobook.description ? (
               <Text style={styles.aboutDescription}>{audiobook.description}</Text>
            ) : null}
         </View>
      );
   }, [audiobook]);

   const renderUpgradeSection = useCallback(() => {
      if (!isAccessRestricted) {
         return null;
      }

      return (
         <View style={styles.upgradeSection}>
            <TouchableOpacity
               style={styles.upgradeBadge}
               onPress={handleUpgradePlanPress}
               activeOpacity={0.7}
            >
               <Ionicons name="lock-closed" size={16} color={colors.accent.primary} />
               <Text style={styles.upgradeBadgeText}>Upgrade your plan</Text>
            </TouchableOpacity>
            {upgradeMessage ? (
               <Text style={styles.upgradeMessage}>{upgradeMessage}</Text>
            ) : null}
         </View>
      );
   }, [isAccessRestricted, upgradeMessage, handleUpgradePlanPress]);

   // Render book header (above tab slide panels)
   const renderBookHeader = useCallback(() => {
      const coverPath = audiobook?.coverImage || audiobook?.chaptersHeroCoverImage;
      const smallCoverUri = coverPath ? `${apiConfig.baseURL}${coverPath}` : undefined;
      const chapterCount = allChapters.length;
      const description = audiobook?.description ?? '';
      const shortDescription =
         description.length > 120 && !descriptionExpanded
            ? `${description.slice(0, 120)}...`
            : description;

      return (
         <>
            {/* Top actions */}
            <View style={styles.topActions}>
               <TouchableOpacity onPress={handleBack} style={styles.topIconButton} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
               </TouchableOpacity>
               <View style={styles.topActionsRight}>
                  <TouchableOpacity style={styles.topIconButton} activeOpacity={0.7}>
                     <Ionicons name="bookmark-outline" size={22} color={colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                     style={styles.topIconButton}
                     activeOpacity={0.7}
                     onPress={() => {
                        const chapter = allChapters.find((c) => c.id === currentPlayingChapterId) ?? allChapters[0];
                        if (chapter) handleCommentsPress(chapter);
                     }}
                  >
                     <Ionicons name="ellipsis-horizontal" size={22} color={colors.text.primary} />
                  </TouchableOpacity>
               </View>
            </View>

            {/* Book row */}
            <View style={styles.bookRow}>
               {smallCoverUri ? (
                  <Image source={{ uri: smallCoverUri }} style={styles.bookCover} contentFit="cover" />
               ) : (
                  <View style={[styles.bookCover, styles.bookCoverPlaceholder]}>
                     <ActivityIndicator color={colors.accent.primary} />
                  </View>
               )}
               <View style={styles.bookInfo}>
                  <Text style={styles.audiobookTitle} numberOfLines={2}>
                     {audiobook?.title ?? 'Loading...'}
                  </Text>
                  {audiobook?.author && (
                     <Text style={styles.bookAuthor}>{audiobook.author}</Text>
                  )}
                  <View style={styles.ratingRow}>
                     {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                           key={star}
                           name="star"
                           size={14}
                           color={colors.accent.primary}
                        />
                     ))}
                  </View>
                  <Text style={styles.bookMeta}>
                     {formattedDuration}
                     {chapterCount > 0 ? ` · ${chapterCount} chapters` : ''}
                  </Text>
               </View>
            </View>

            {/* Play / Download */}
            {!isAccessRestricted && (
               <View style={styles.actionButtons}>
                  <PrimaryButton title="Play" onPress={handlePlayAll} style={styles.playBtn} />
                  <SecondaryButton title="Download" onPress={() => {}} style={styles.downloadBtn} />
               </View>
            )}

            {/* Description */}
            {description ? (
               <View style={styles.descriptionSection}>
                  <Text style={styles.description}>{shortDescription}</Text>
                  {description.length > 120 && (
                     <TouchableOpacity onPress={() => setDescriptionExpanded(!descriptionExpanded)}>
                        <Text style={styles.moreLink}>
                           {descriptionExpanded ? 'Less' : 'More'}
                        </Text>
                     </TouchableOpacity>
                  )}
               </View>
            ) : null}

            <TabUnderline
               tabs={[
                  { key: 'chapters', label: 'Chapters' },
                  { key: 'about', label: 'About' },
               ]}
               activeKey={detailTab}
               onTabPress={handleDetailTabPress}
            />

            {renderUpgradeSection()}
         </>
      );
   }, [
      audiobook,
      allChapters,
      formattedDuration,
      descriptionExpanded,
      detailTab,
      handleBack,
      handlePlayAll,
      handleCommentsPress,
      currentPlayingChapterId,
      handleDetailTabPress,
      renderUpgradeSection,
      isAccessRestricted,
   ]);

   return (
      <>
         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.bookHeaderWrapper}>{renderBookHeader()}</View>
            <TabSlideView
               activeKey={detailTab}
               tabKeys={['chapters', 'about']}
               onTabChange={handleDetailTabPress}
               style={styles.tabSlideContainer}
            >
               <FlatList
                  data={isAccessRestricted ? [] : allChapters}
                  renderItem={renderChapterItem}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={renderEmpty}
                  ListFooterComponent={renderFooter}
                  onEndReached={loadNextPage}
                  onEndReachedThreshold={0.5}
                  removeClippedSubviews={true}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
               />
               <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
               >
                  {renderAboutContent()}
               </ScrollView>
            </TabSlideView>
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   bookHeaderWrapper: {
      flexShrink: 0,
   },
   tabSlideContainer: {
      flex: 1,
   },
   topActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
   },
   topActionsRight: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   topIconButton: {
      padding: spacing.xs,
      marginLeft: spacing.xs,
   },
   bookRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
   },
   bookCover: {
      width: 88,
      height: 88,
      borderRadius: borderRadius.lg,
      marginRight: spacing.md,
   },
   bookCoverPlaceholder: {
      backgroundColor: colors.background.highlight,
      alignItems: 'center',
      justifyContent: 'center',
   },
   bookInfo: {
      flex: 1,
      justifyContent: 'center',
   },
   bookAuthor: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.xs,
   },
   ratingRow: {
      flexDirection: 'row',
      marginTop: spacing.xs,
      gap: 2,
   },
   bookMeta: {
      fontSize: typography.fontSize.xs,
      color: colors.text.muted,
      marginTop: spacing.xs,
   },
   actionButtons: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
   },
   playBtn: {
      flex: 1,
   },
   downloadBtn: {
      flex: 1,
   },
   descriptionSection: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
   },
   moreLink: {
      fontSize: typography.fontSize.sm,
      color: colors.accent.primary,
      fontWeight: '600',
      marginTop: spacing.xs,
   },
   aboutSection: {
      padding: spacing.md,
   },
   aboutText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
   },
   aboutDescription: {
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      lineHeight: 22,
      marginTop: spacing.md,
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
      fontSize: typography.fontSize.lg,
      color: colors.text.primary,
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
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      lineHeight: 20,
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
   upgradeSection: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
   },
   upgradeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      backgroundColor: colors.app.red,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
         },
         android: {
            elevation: 5,
         },
      }),
   },
   upgradeBadgeText: {
      fontSize: typography.fontSize.base,
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
   upgradeMessage: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
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
