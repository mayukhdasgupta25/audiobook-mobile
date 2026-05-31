import React, { useMemo, useCallback, useRef, useState } from 'react';
import {
   View,
   StyleSheet,
   ScrollView,
   Text,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { ContinueListeningCard } from '@/components/ContinueListeningCard';
import { MoodChip } from '@/components/MoodChip';
import { useMoods } from '@/hooks/useMoods';
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { DrawerMenu } from '@/components/DrawerMenu';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';
import { useHomeContent } from '@/hooks/useHomeContent';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useAudiobook } from '@/hooks/useAudiobook';
import { useOrganizations } from '@/hooks/useOrganizations';
import { PublisherRow } from '@/components/PublisherRow';
import {
   SkeletonContentRow,
   SkeletonContinueListeningCard,
   SkeletonMoodCards,
   SkeletonTrendingList,
} from '@/components/skeleton';
import { apiConfig } from '@/services/api';
import { Organization } from '@/services/organizations';
import { logout } from '@/utils/logout';
import { resolveAvatarUrl } from '@/utils/resolveAvatarUrl';
import { resolveMembershipTier } from '@/utils/membershipDisplay';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useTabScrollToTop } from '@/hooks/useTabScrollToTop';
import { RootState } from '@/store';

const HEADER_ICON_SIZE = 24;
const HEADER_ICON_HIT_SLOP = spacing.xs;
const HEADER_ICON_BUTTON_SIZE = HEADER_ICON_SIZE + HEADER_ICON_HIT_SLOP * 2;
const TOP_BAR_HEIGHT = HEADER_ICON_BUTTON_SIZE + spacing.sm * 2;

function HomeScreenContent() {
   const paginationTriggeredRef = useRef<Record<string, boolean>>({});
   const scrollRef = useRef<ScrollView>(null);
   const insets = useSafeAreaInsets();
   const [drawerVisible, setDrawerVisible] = useState(false);
   const { greeting, subtitle: timeOfDaySubtitle } = useTimeOfDay();

   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const { activeSubscription } = useUserSubscription();
   const playerAudiobookId = useSelector((state: RootState) => state.player.audiobookId);
   const chapterMetadata = useSelector((state: RootState) => state.player.chapterMetadata);
   const playbackPosition = useSelector((state: RootState) => state.player.playbackPosition);
   const totalDuration = useSelector((state: RootState) => state.player.totalDuration);

   const greetingName = useMemo(() => {
      if (userProfile?.firstName) return userProfile.firstName;
      return 'there';
   }, [userProfile]);

   const drawerDisplayName = useMemo(() => {
      if (userProfile?.firstName && userProfile?.lastName) {
         return `${userProfile.firstName} ${userProfile.lastName}`;
      }
      if (userProfile?.firstName) return userProfile.firstName;
      if (userProfile?.username) return userProfile.username;
      return 'User';
   }, [userProfile]);
   const drawerAvatarUri = resolveAvatarUrl(userProfile?.avatar);
   const membershipTier = resolveMembershipTier(activeSubscription?.plan);
   const planName = activeSubscription?.plan.name;

   const handleDrawerNavigate = useCallback((href: string) => {
      router.push(href as never);
   }, []);

   const handleDrawerSignOut = useCallback(async () => {
      try {
         await logout();
      } catch (error) {
         console.error('[Home] Logout failed:', error);
      }
   }, []);

   const { contentRows, isLoading, loadNextPage, heroCarouselItems } = useHomeContent();
   const isInitialHomeLoading = isLoading && contentRows.length === 0;
   const { data: moods, isLoading: moodsLoading } = useMoods();
   const { data: organizationsData, isLoading: organizationsLoading, isPending: organizationsPending } = useOrganizations();
   const organizations = organizationsData?.data ?? [];

   const getOrganizationImageUri = useCallback((org: Organization) => {
      const path = org.logo ?? org.coverImage;
      return path ? `${apiConfig.baseURL}${path}` : undefined;
   }, []);

   const handlePublisherPress = useCallback((org: Organization) => {
      const imagePath = org.logo ?? org.coverImage;
      router.push({
         pathname: '/publisher/[id]',
         params: {
            id: org.id,
            name: org.name,
            ...(org.description ? { description: org.description } : {}),
            ...(imagePath ? { imagePath } : {}),
         },
      } as never);
   }, []);

   const continueAudiobookId = playerAudiobookId ?? heroCarouselItems[0]?.id ?? null;
   const { data: continueAudiobookData, isLoading: continueAudiobookLoading } =
      useAudiobook(continueAudiobookId ?? '');
   const continueAudiobook = continueAudiobookData?.data;

   const continueListening = useMemo(() => {
      const book = continueAudiobook ?? heroCarouselItems[0];
      if (!book) return null;

      const coverPath = book.coverImage || book.contentCardCoverImage;
      const coverUri = coverPath ? `${apiConfig.baseURL}${coverPath}` : undefined;
      const progress =
         totalDuration > 0 && playerAudiobookId === book.id
            ? playbackPosition / totalDuration
            : 0;

      return {
         id: book.id,
         title: book.title,
         author: book.author,
         coverUri,
         chapterTitle: chapterMetadata?.title,
         progress,
         elapsedSeconds: playerAudiobookId === book.id ? playbackPosition : 0,
         totalSeconds: playerAudiobookId === book.id ? totalDuration : book.duration ?? 0,
      };
   }, [
      continueAudiobook,
      heroCarouselItems,
      chapterMetadata,
      playbackPosition,
      totalDuration,
      playerAudiobookId,
   ]);

   const yourPicksRow = useMemo(() => {
      return contentRows.find((row) => row.items.length > 0) ?? null;
   }, [contentRows]);

   const trendingItems = useMemo(() => {
      const trendingRow = contentRows.find((row) =>
         row.title.toLowerCase().includes('trending')
      );
      const booksById = new Map(heroCarouselItems.map((book) => [book.id, book]));

      const mapBook = (id: string, title: string, imageUri?: string) => {
         const book = booksById.get(id);
         const coverPath = book?.coverImage || book?.contentCardCoverImage;
         return {
            id,
            title,
            author: book?.author ?? 'Unknown author',
            imageUri:
               imageUri ??
               (coverPath ? `${apiConfig.baseURL}${coverPath}` : undefined),
         };
      };

      if (trendingRow?.items.length) {
         return trendingRow.items.map((item) =>
            mapBook(item.id, item.title, item.imageUri)
         );
      }

      return heroCarouselItems.map((book) =>
         mapBook(
            book.id,
            book.title,
            book.coverImage ? `${apiConfig.baseURL}${book.coverImage}` : undefined
         )
      );
   }, [contentRows, heroCarouselItems]);

   const scrollPadding = getTabScreenPaddingBottom(insets.bottom);

   const handleItemPress = useCallback((item: ContentItem) => {
      router.push(`/details/${item.id}`);
   }, []);

   const handleEndReached = useCallback(
      (rowId: string) => {
         const row = contentRows.find((r) => r.id === rowId);
         if (
            row?.pagination?.hasNextPage &&
            !paginationTriggeredRef.current[rowId] &&
            !row.isLoading
         ) {
            paginationTriggeredRef.current[rowId] = true;
            loadNextPage(rowId);
            setTimeout(() => {
               paginationTriggeredRef.current[rowId] = false;
            }, 1000);
         }
      },
      [contentRows, loadNextPage]
   );

   const handleContinuePress = useCallback(() => {
      if (continueListening?.id) {
         router.push(`/details/${continueListening.id}`);
      }
   }, [continueListening?.id]);

   const handleContinuePlay = useCallback(() => {
      if (continueListening?.id) {
         router.push(`/details/${continueListening.id}?autoPlay=true`);
      }
   }, [continueListening?.id]);

   const showContinueListeningSkeleton =
      !continueListening &&
      (isInitialHomeLoading ||
         (Boolean(continueAudiobookId) && continueAudiobookLoading));

   const showPublishersSkeleton =
      organizationsPending ||
      organizationsLoading ||
      (organizations.length === 0 && isLoading);

   const showYourPicksSkeleton = isLoading && !(yourPicksRow?.items.length);

   const showTrendingSkeleton = isLoading && trendingItems.length === 0;

   useTabScrollToTop('index', scrollRef);

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.topBar}>
            <TouchableOpacity
               onPress={() => setDrawerVisible(true)}
               style={styles.iconButton}
               activeOpacity={0.7}
               accessibilityLabel="Open menu"
               accessibilityRole="button"
            >
               <Ionicons name="grid-outline" size={HEADER_ICON_SIZE} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
               onPress={() => {}}
               style={styles.iconButton}
               activeOpacity={0.7}
               accessibilityLabel="Notifications"
               accessibilityRole="button"
            >
               <Ionicons
                  name="notifications-outline"
                  size={HEADER_ICON_SIZE}
                  color={colors.text.primary}
               />
            </TouchableOpacity>
         </View>

         <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={[
               styles.scrollContent,
               { paddingBottom: scrollPadding },
            ]}
            showsVerticalScrollIndicator={false}
         >
            {/* Greeting */}
            <View style={styles.greetingSection}>
               <Text style={styles.greeting}>
                  {greeting}, {greetingName}
               </Text>
               <Text style={styles.greetingSubtitle}>{timeOfDaySubtitle}</Text>
            </View>

            {/* Search */}
            <TouchableOpacity
               style={styles.searchBar}
               onPress={() => router.push('/search')}
               activeOpacity={0.8}
            >
               <Ionicons name="search" size={20} color={colors.text.muted} />
               <Text style={styles.searchPlaceholder}>Search stories, authors, genres...</Text>
            </TouchableOpacity>

            <PublisherRow
               organizations={organizations}
               isLoading={showPublishersSkeleton}
               getImageUri={getOrganizationImageUri}
               onPress={handlePublisherPress}
            />

            {/* Continue Listening */}
            {(continueListening || showContinueListeningSkeleton) && (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Continue Listening</Text>
                  {continueListening ? (
                     <ContinueListeningCard
                        title={continueListening.title}
                        author={continueListening.author}
                        coverUri={continueListening.coverUri}
                        chapterTitle={continueListening.chapterTitle}
                        progress={continueListening.progress}
                        elapsedSeconds={continueListening.elapsedSeconds}
                        totalSeconds={continueListening.totalSeconds}
                        onPress={handleContinuePress}
                        onPlayPress={handleContinuePlay}
                     />
                  ) : (
                     <SkeletonContinueListeningCard />
                  )}
               </View>
            )}

            {/* Your Picks */}
            {(yourPicksRow?.items.length || showYourPicksSkeleton) ? (
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <Text style={styles.sectionTitle}>Your Picks</Text>
                     {yourPicksRow?.items.length ? (
                        <TouchableOpacity activeOpacity={0.7}>
                           <Text style={styles.viewAll}>View all</Text>
                        </TouchableOpacity>
                     ) : null}
                  </View>
                  {yourPicksRow?.items.length ? (
                     <ContentRow
                        title=""
                        items={yourPicksRow.items}
                        onItemPress={handleItemPress}
                        onEndReached={() => handleEndReached(yourPicksRow.id)}
                     />
                  ) : (
                     <SkeletonContentRow hideTitle cardWidth={140} cardCount={4} />
                  )}
               </View>
            ) : null}

            {/* Explore By Mood */}
            <View style={styles.section}>
               <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>
                  Explore By Mood
               </Text>
               <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.moodRow}
               >
                  {moodsLoading ? (
                     <SkeletonMoodCards />
                  ) : (
                     (moods ?? []).map((mood) => (
                        <MoodChip
                           key={mood.id}
                           mood={mood}
                           variant="card"
                           onPress={() => router.push(`/moods/${mood.id}` as never)}
                        />
                     ))
                  )}
               </ScrollView>
            </View>

            {/* New and Trending */}
            <View style={styles.trendingSection}>
               <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>
                  New and Trending
               </Text>
               <View style={styles.trendingList}>
                  {showTrendingSkeleton ? (
                     <SkeletonTrendingList count={3} />
                  ) : (
                     trendingItems.map((item, index) => (
                     <TouchableOpacity
                        key={item.id}
                        style={[
                           styles.trendingCard,
                           index === trendingItems.length - 1 && styles.trendingCardLast,
                        ]}
                        onPress={() => router.push(`/details/${item.id}`)}
                        activeOpacity={0.85}
                     >
                        {item.imageUri ? (
                           <Image
                              source={{ uri: item.imageUri }}
                              style={styles.trendingCardCover}
                              contentFit="cover"
                           />
                        ) : (
                           <View
                              style={[
                                 styles.trendingCardCover,
                                 styles.trendingCoverPlaceholder,
                              ]}
                           >
                              <Text style={styles.trendingCoverLetter}>
                                 {item.title.charAt(0)}
                              </Text>
                           </View>
                        )}
                        <View style={styles.trendingCardBody}>
                           <Text style={styles.trendingTitle} numberOfLines={2}>
                              {item.title}
                           </Text>
                           <Text style={styles.trendingAuthor} numberOfLines={1}>
                              {item.author}
                           </Text>
                        </View>
                        <TouchableOpacity
                           style={styles.trendingPlay}
                           onPress={() =>
                              router.push(`/details/${item.id}?autoPlay=true`)
                           }
                           activeOpacity={0.8}
                        >
                           <Ionicons name="play" size={18} color={colors.accent.primary} />
                        </TouchableOpacity>
                     </TouchableOpacity>
                  ))
                  )}
               </View>
            </View>
         </ScrollView>

         <DrawerMenu
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            currentRoute="index"
            displayName={drawerDisplayName}
            avatarUri={drawerAvatarUri}
            membershipTier={membershipTier}
            planName={planName}
            onNavigate={handleDrawerNavigate}
            onSignOut={handleDrawerSignOut}
         />
      </SafeAreaView>
   );
}

export default function HomeScreen() {
   return (
      <AnimatedTabScreen direction="left" currentRoute="index">
         <HomeScreenContent />
      </AnimatedTabScreen>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      paddingTop: spacing.xs,
   },
   topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: TOP_BAR_HEIGHT,
      paddingHorizontal: spacing.md,
   },
   iconButton: {
      width: HEADER_ICON_BUTTON_SIZE,
      height: HEADER_ICON_BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
   },
   greetingSection: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
   },
   greeting: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: '700',
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   greetingSubtitle: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      marginTop: spacing.xs,
   },
   searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.input,
      borderRadius: borderRadius.lg,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.md,
      height: 48,
      gap: spacing.sm,
   },
   searchPlaceholder: {
      fontSize: typography.fontSize.base,
      color: colors.text.muted,
      flex: 1,
   },
   section: {
      marginBottom: spacing.lg,
   },
   sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   sectionTitlePadded: {
      marginBottom: spacing.sm,
   },
   viewAll: {
      fontSize: typography.fontSize.sm,
      color: colors.accent.primary,
      fontWeight: '500',
   },
   moodRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
   },
   trendingSection: {
      marginBottom: 0,
   },
   trendingList: {
      paddingHorizontal: spacing.md,
   },
   trendingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 112,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.background.card,
      ...shadows.sm,
   },
   trendingCardLast: {
      marginBottom: 0,
   },
   trendingCardCover: {
      width: 72,
      height: 96,
      borderRadius: borderRadius.lg,
      marginRight: spacing.md,
   },
   trendingCardBody: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      marginRight: spacing.sm,
   },
   trendingCoverPlaceholder: {
      backgroundColor: colors.background.highlight,
      alignItems: 'center',
      justifyContent: 'center',
   },
   trendingCoverLetter: {
      fontSize: typography.fontSize.lg,
      fontWeight: '700',
      color: colors.accent.primary,
   },
   trendingTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: typography.fontSize.lg * 1.3,
   },
   trendingAuthor: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.xs,
   },
   trendingPlay: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary[50],
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
   },
   loadingContainer: {
      padding: spacing.xl,
      alignItems: 'center',
   },
   loadingText: {
      marginTop: spacing.md,
      color: colors.text.secondary,
   },
   errorContainer: {
      padding: spacing.xl,
      alignItems: 'center',
   },
   errorText: {
      color: colors.error,
      textAlign: 'center',
   },
});
