import React, { useMemo, useCallback, useRef, useState } from 'react';
import {
   View,
   StyleSheet,
   ScrollView,
   Text,
   ActivityIndicator,
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
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { DrawerMenu } from '@/components/DrawerMenu';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';
import { useHomeContent } from '@/hooks/useHomeContent';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useAudiobook } from '@/hooks/useAudiobook';
import { useOrganizations } from '@/hooks/useOrganizations';
import { PublisherRow } from '@/components/PublisherRow';
import { apiConfig } from '@/services/api';
import { Organization } from '@/services/organizations';
import { RootState } from '@/store';

const MOOD_CHIPS = [
   { label: 'Motivation', icon: 'flame-outline' as const },
   { label: 'Focus', icon: 'eye-outline' as const },
   { label: 'Calm', icon: 'leaf-outline' as const },
   { label: 'Growth', icon: 'trending-up-outline' as const },
];

function HomeScreenContent() {
   const paginationTriggeredRef = useRef<Record<string, boolean>>({});
   const insets = useSafeAreaInsets();
   const [drawerVisible, setDrawerVisible] = useState(false);
   const { greeting, subtitle: timeOfDaySubtitle } = useTimeOfDay();

   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const playerAudiobookId = useSelector((state: RootState) => state.player.audiobookId);
   const chapterMetadata = useSelector((state: RootState) => state.player.chapterMetadata);
   const playbackPosition = useSelector((state: RootState) => state.player.playbackPosition);
   const totalDuration = useSelector((state: RootState) => state.player.totalDuration);

   const displayName = useMemo(() => {
      if (userProfile?.firstName) return userProfile.firstName;
      return 'there';
   }, [userProfile]);

   const { contentRows, isLoading, error, loadNextPage, heroCarouselItems } = useHomeContent();
   const { data: organizationsData, isLoading: organizationsLoading } = useOrganizations();
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
   const { data: continueAudiobookData } = useAudiobook(continueAudiobookId ?? '');
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

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
               styles.scrollContent,
               { paddingBottom: scrollPadding },
            ]}
            showsVerticalScrollIndicator={false}
         >
            {/* Top bar */}
            <View style={styles.topBar}>
               <TouchableOpacity
                  onPress={() => setDrawerVisible(true)}
                  style={styles.iconButton}
                  activeOpacity={0.7}
               >
                  <Ionicons name="grid-outline" size={24} color={colors.text.primary} />
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
                     size={24}
                     color={colors.text.primary}
                  />
               </TouchableOpacity>
            </View>

            {/* Greeting */}
            <View style={styles.greetingSection}>
               <Text style={styles.greeting}>
                  {greeting}, {displayName}
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
               isLoading={organizationsLoading}
               getImageUri={getOrganizationImageUri}
               onPress={handlePublisherPress}
            />

            {/* Continue Listening */}
            {continueListening && (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Continue Listening</Text>
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
               </View>
            )}

            {/* Your Picks */}
            {yourPicksRow && yourPicksRow.items.length > 0 && (
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <Text style={styles.sectionTitle}>Your Picks</Text>
                     <TouchableOpacity activeOpacity={0.7}>
                        <Text style={styles.viewAll}>View all</Text>
                     </TouchableOpacity>
                  </View>
                  <ContentRow
                     title=""
                     items={yourPicksRow.items}
                     onItemPress={handleItemPress}
                     onEndReached={() => handleEndReached(yourPicksRow.id)}
                  />
               </View>
            )}

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
                  {MOOD_CHIPS.map((mood) => (
                     <MoodChip
                        key={mood.label}
                        label={mood.label}
                        icon={mood.icon}
                        onPress={() => router.push('/(tabs)/discover' as never)}
                     />
                  ))}
               </ScrollView>
            </View>

            {/* New and Trending */}
            <View style={styles.trendingSection}>
               <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>
                  New and Trending
               </Text>
               <View style={styles.trendingList}>
                  {trendingItems.map((item, index) => (
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
                  ))}
               </View>
            </View>

            {isLoading && contentRows.length === 0 && (
               <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.accent.primary} />
                  <Text style={styles.loadingText}>Loading audiobooks...</Text>
               </View>
            )}
            {error && (
               <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                     {typeof error === 'string' ? error : 'An error occurred'}
                  </Text>
               </View>
            )}
         </ScrollView>

         <DrawerMenu
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onAccountPress={() => {
               setDrawerVisible(false);
               router.push('/account');
            }}
            onAppSettingsPress={() => {
               setDrawerVisible(false);
               router.push('/account');
            }}
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
   },
   iconButton: {
      padding: spacing.xs,
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
      borderWidth: 1,
      borderColor: colors.border.light,
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
      borderWidth: 1.5,
      borderColor: colors.accent.primary,
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
