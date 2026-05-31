import React, { useCallback, useMemo } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   Platform,
   ActivityIndicator,
   TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { MoodChip } from '@/components/MoodChip';
import { useMoods } from '@/hooks/useMoods';
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';
import { useHomeContent } from '@/hooks/useHomeContent';
import { apiConfig } from '@/services/api';

function DiscoverScreenContent() {
   const insets = useSafeAreaInsets();
   const { contentRows, isLoading, heroCarouselItems } = useHomeContent();
   const { data: moods, isLoading: moodsLoading } = useMoods();

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
            imageUri: book.coverImage
               ? `${apiConfig.baseURL}${book.coverImage}`
               : undefined,
         })),
      [heroCarouselItems]
   );

   const handleItemPress = useCallback((item: ContentItem) => {
      router.push(`/details/${item.id}`);
   }, []);

   const scrollPadding = getTabScreenPaddingBottom(insets.bottom);

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.header}>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.subtitle}>Browse and explore new stories</Text>
         </View>
         <ScrollView
            contentContainerStyle={{ paddingBottom: scrollPadding }}
            showsVerticalScrollIndicator={false}
         >
            <Text style={styles.sectionTitle}>Explore By Mood</Text>
            <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.moodRow}
            >
               {moodsLoading ? (
                  <ActivityIndicator size="small" color={colors.accent.primary} />
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
               <ActivityIndicator
                  size="large"
                  color={colors.accent.primary}
                  style={styles.loader}
               />
            ) : (
               trendingItems.map((item) => (
                  <TouchableOpacity
                     key={item.id}
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
               ))
            )}

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

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
   },
   title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: '700',
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   subtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.xs,
   },
   sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
   },
   cover: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      marginRight: spacing.md,
   },
   coverPlaceholder: {
      backgroundColor: colors.background.highlight,
      alignItems: 'center',
      justifyContent: 'center',
   },
   coverLetter: {
      fontSize: typography.fontSize.lg,
      fontWeight: '700',
      color: colors.accent.primary,
   },
   trendingInfo: {
      flex: 1,
   },
   trendingTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.primary,
   },
   trendingAuthor: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: 2,
   },
   playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
   },
   loader: {
      marginVertical: spacing.xl,
   },
});
