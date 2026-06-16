import React, { useCallback, useMemo, useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { TabScreenHeader } from '@/components/TabScreenHeader';
import { MoodChip } from '@/components/MoodChip';
import { useMoods } from '@/hooks/useMoods';
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { SkeletonMoodChips, SkeletonDiscoverTrendingRow, SkeletonContentRow } from '@/components/skeleton';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';
import { useHomeContent } from '@/hooks/useHomeContent';
import { resolveAudiobookImageUrl } from '@/utils/imageAssets';
import { useTabScrollToTop } from '@/hooks/useTabScrollToTop';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

function DiscoverScreenContent() {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flex: 1,
            backgroundColor: t.colors.background.screen,
         },
         sectionTitle: {
            fontSize: typography.fontSize.lg,
            fontWeight: '600',
            color: t.colors.text.primary,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.sm,
            marginTop: spacing.md,
         },
         moodRow: {
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
         },
         trendingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
         },
         rowDivider: {
            height: 1,
            backgroundColor: t.colors.background.highlight,
         },
         cover: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.md,
            marginRight: spacing.md,
         },
         coverPlaceholder: {
            backgroundColor: t.colors.background.highlight,
            alignItems: 'center',
            justifyContent: 'center',
         },
         coverLetter: {
            fontSize: typography.fontSize.lg,
            fontWeight: '700',
            color: t.colors.accent.primary,
         },
         trendingInfo: {
            flex: 1,
         },
         trendingTitle: {
            fontSize: typography.fontSize.base,
            fontWeight: '600',
            color: t.colors.text.primary,
         },
         trendingAuthor: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginTop: 2,
         },
         playButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.colors.primary[50],
            alignItems: 'center',
            justifyContent: 'center',
         },
         loader: {
            marginVertical: spacing.xl,
         },
      })
   );
   const scrollRef = useRef<ScrollView>(null);
   const insets = useSafeAreaInsets();
   const {
      contentRows,
      isLoading,
      heroCarouselItems,
      refetchAll,
      isRefetching: isHomeContentRefetching,
   } = useHomeContent();
   const {
      data: moods,
      isLoading: moodsLoading,
      refetch: refetchMoods,
      isRefetching: isMoodsRefetching,
   } = useMoods();

   const genreRows = useMemo(
      () => contentRows.filter((row) => row.type === 'genre' && row.items.length > 0),
      [contentRows]
   );

   const trendingItems = useMemo(
      () =>
         heroCarouselItems.slice(0, 8).map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            imageUri: resolveAudiobookImageUrl(book, 'popularStory'),
         })),
      [heroCarouselItems]
   );

   const handleItemPress = useCallback((item: ContentItem) => {
      router.push(`/details/${item.id}`);
   }, []);

   const scrollPadding = getTabScreenPaddingBottom(insets.bottom);

   useTabScrollToTop('discover', scrollRef);

   const discoverRefreshFns = useMemo(
      () => [refetchAll, refetchMoods],
      [refetchAll, refetchMoods]
   );
   const { refreshing, onRefresh } = usePullToRefresh(discoverRefreshFns, {
      isRefetching: isHomeContentRefetching || isMoodsRefetching,
   });

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <TabScreenHeader headerIcon="discover" />
         <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingBottom: scrollPadding }}
            showsVerticalScrollIndicator={false}
            refreshControl={
               <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent.primary}
                  colors={[colors.accent.primary]}
               />
            }
         >
            <Text style={styles.sectionTitle}>Explore By Mood</Text>
            <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.moodRow}
            >
               {moodsLoading ? (
                  <SkeletonMoodChips />
               ) : (
                  (moods ?? []).map((mood) => (
                     <MoodChip
                        key={mood.id}
                        mood={mood}
                        onPress={() => router.push(`/moods/${mood.id}` as never)}
                     />
                  ))
               )}
            </ScrollView>

            <Text style={styles.sectionTitle}>Trending Now</Text>
            {isLoading && trendingItems.length === 0 ? (
               <SkeletonDiscoverTrendingRow count={5} />
            ) : (
               trendingItems.map((item) => (
                  <View key={item.id}>
                  <TouchableOpacity
                     style={styles.trendingRow}
                     onPress={() => router.push(`/details/${item.id}`)}
                     activeOpacity={0.7}
                  >
                     {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.cover} />
                     ) : (
                        <View style={[styles.cover, styles.coverPlaceholder]}>
                           <Text style={styles.coverLetter}>{item.title.charAt(0)}</Text>
                        </View>
                     )}
                     <View style={styles.trendingInfo}>
                        <Text style={styles.trendingTitle} numberOfLines={1}>
                           {item.title}
                        </Text>
                        <Text style={styles.trendingAuthor} numberOfLines={1}>
                           {item.author}
                        </Text>
                     </View>
                     <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => router.push(`/details/${item.id}?autoPlay=true`)}
                     >
                        <Ionicons name="play" size={16} color={colors.accent.primary} />
                     </TouchableOpacity>
                  </TouchableOpacity>
                  <View style={styles.rowDivider} />
                  </View>
               ))
            )}

            {isLoading && genreRows.length === 0 ? (
               <>
                  <SkeletonContentRow titleWidth={140} cardCount={4} />
                  <SkeletonContentRow titleWidth={120} cardCount={4} />
               </>
            ) : null}

            {genreRows.map((row) => (
               <ContentRow
                  key={row.id}
                  title={row.title}
                  items={row.items}
                  onItemPress={handleItemPress}
               />
            ))}
         </ScrollView>
      </SafeAreaView>
   );
}

export default function DiscoverScreen() {
   return (
      <AnimatedTabScreen direction="right" currentRoute="discover">
         <DiscoverScreenContent />
      </AnimatedTabScreen>
   );
}
