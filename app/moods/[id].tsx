import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MoodHeroCard } from '@/components/moods/MoodHeroCard';
import { MoodBestForCard } from '@/components/moods/MoodBestForCard';
import { MoodAudiobookRow } from '@/components/moods/MoodAudiobookRow';
import { MoodAboutSection } from '@/components/moods/MoodAboutSection';
import { SkeletonMoodDetailPage, SkeletonMoodAudiobookRow } from '@/components/skeleton';
import { useMood } from '@/hooks/useMood';
import { useMoodAudiobooks } from '@/hooks/useMoodAudiobooks';
import { colors, spacing, typography } from '@/theme';
import { normalizeHexCode } from '@/utils/moodAssets';
import { Audiobook } from '@/services/audiobooks';

const PREVIEW_LIMIT = 4;

const BACK_BUTTON_SIZE = 40;

export default function MoodDetailScreen() {
   const insets = useSafeAreaInsets();
   const params = useLocalSearchParams<{ id: string }>();
   const moodId = params.id ?? '';
   const [showAllRecommendations, setShowAllRecommendations] = useState(false);
   const [recommendationsPage, setRecommendationsPage] = useState(1);
   const [allAudiobooks, setAllAudiobooks] = useState<Audiobook[]>([]);

   const {
      data: mood,
      isLoading: isMoodLoading,
      error: moodError,
   } = useMood(moodId);

   const {
      data: audiobooksData,
      isLoading: isAudiobooksLoading,
      error: audiobooksError,
      isFetching: isAudiobooksFetching,
   } = useMoodAudiobooks(moodId, recommendationsPage);

   const moodColor = normalizeHexCode(mood?.hexCode ?? '#6F431B');
   const pagination = audiobooksData?.pagination;

   useEffect(() => {
      if (!audiobooksData?.data) return;
      setAllAudiobooks((prev) => {
         if (recommendationsPage === 1) {
            return audiobooksData.data;
         }
         const ids = new Set(prev.map((book) => book.id));
         const merged = [...prev];
         for (const book of audiobooksData.data) {
            if (!ids.has(book.id)) {
               merged.push(book);
            }
         }
         return merged;
      });
   }, [audiobooksData, recommendationsPage]);

   const visibleAudiobooks = useMemo(() => {
      if (showAllRecommendations) {
         return allAudiobooks;
      }
      return allAudiobooks.slice(0, PREVIEW_LIMIT);
   }, [allAudiobooks, showAllRecommendations]);

   const canViewAll =
      !showAllRecommendations &&
      (allAudiobooks.length > PREVIEW_LIMIT || pagination?.hasNextPage === true);

   const handleBackPress = useCallback(() => {
      router.back();
   }, []);

   const handleViewAllPress = useCallback(() => {
      setShowAllRecommendations(true);
   }, []);

   const handleLoadMoreRecommendations = useCallback(() => {
      if (pagination?.hasNextPage && !isAudiobooksFetching) {
         setRecommendationsPage((page) => page + 1);
      }
   }, [pagination?.hasNextPage, isAudiobooksFetching]);

   if (isMoodLoading) {
      return (
         <SafeAreaView style={styles.container} edges={['bottom']}>
            <SkeletonMoodDetailPage />
         </SafeAreaView>
      );
   }

   if (moodError || !mood) {
      return (
         <SafeAreaView style={styles.centered}>
            <Text style={styles.emptyText}>No mood details available.</Text>
         </SafeAreaView>
      );
   }

   return (
      <>
         <Stack.Screen options={{ headerShown: false }} />
         <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={styles.scrollContent}
               showsVerticalScrollIndicator={false}
               onScroll={({ nativeEvent }) => {
                  if (!showAllRecommendations) return;
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  const isNearBottom =
                     layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
                  if (isNearBottom) {
                     handleLoadMoreRecommendations();
                  }
               }}
               scrollEventThrottle={200}
            >
               <MoodHeroCard mood={mood} topInset={insets.top} />

               {mood.moodAttributes.length > 0 ? (
                  <View style={styles.section}>
                     <Text style={styles.sectionTitle}>Best for</Text>
                     <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.bestForRow}
                     >
                        {mood.moodAttributes.map((attribute, index) => (
                           <MoodBestForCard
                              key={`${attribute.iconName}-${index}`}
                              attribute={attribute}
                              moodColor={moodColor}
                           />
                        ))}
                     </ScrollView>
                  </View>
               ) : null}

               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <Text style={styles.sectionTitle}>Recommended for {mood.name}</Text>
                     {canViewAll ? (
                        <TouchableOpacity onPress={handleViewAllPress} activeOpacity={0.7}>
                           <Text style={styles.viewAll}>View all</Text>
                        </TouchableOpacity>
                     ) : null}
                  </View>

                  <View style={styles.recommendationsCard}>
                     {isAudiobooksLoading && allAudiobooks.length === 0 ? (
                        <SkeletonMoodAudiobookRow count={4} />
                     ) : audiobooksError ? (
                        <View style={styles.loadingBlock}>
                           <Text style={styles.emptyText}>No recommendations yet.</Text>
                        </View>
                     ) : visibleAudiobooks.length === 0 ? (
                        <View style={styles.loadingBlock}>
                           <Text style={styles.emptyText}>No recommendations yet.</Text>
                        </View>
                     ) : (
                        visibleAudiobooks.map((audiobook) => (
                           <MoodAudiobookRow
                              key={audiobook.id}
                              audiobook={audiobook}
                              onPress={() => router.push(`/details/${audiobook.id}` as never)}
                              onPlayPress={() =>
                                 router.push(`/details/${audiobook.id}?autoPlay=true` as never)
                              }
                           />
                        ))
                     )}

                     {showAllRecommendations && isAudiobooksFetching ? (
                        <SkeletonMoodAudiobookRow count={2} />
                     ) : null}
                  </View>
               </View>

               <MoodAboutSection
                  moodName={mood.name}
                  purpose={mood.purpose}
                  moodColor={moodColor}
               />
            </ScrollView>

            <View style={styles.backButtonOverlay} pointerEvents="box-none">
               <TouchableOpacity
                  style={[
                     styles.actionButton,
                     { top: insets.top + spacing.sm, left: spacing.md },
                  ]}
                  onPress={handleBackPress}
                  activeOpacity={0.7}
               >
                  <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
               </TouchableOpacity>
            </View>
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.screen,
      paddingHorizontal: spacing.lg,
   },
   backButtonOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
   },
   actionButton: {
      position: 'absolute',
      width: BACK_BUTTON_SIZE,
      height: BACK_BUTTON_SIZE,
      borderRadius: BACK_BUTTON_SIZE / 2,
      backgroundColor: colors.background.card,
      justifyContent: 'center',
      alignItems: 'center',
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      flexGrow: 1,
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
      color: colors.text.primary,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
      }),
   },
   viewAll: {
      fontSize: typography.fontSize.sm,
      color: colors.accent.primary,
      paddingHorizontal: spacing.md,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   bestForRow: {
      paddingHorizontal: spacing.md,
   },
   recommendationsCard: {
      marginHorizontal: spacing.md,
      backgroundColor: colors.background.card,
      borderRadius: spacing.md,
      paddingHorizontal: spacing.md,
   },
   loadingBlock: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
   },
   emptyText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
   },
   errorText: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      marginBottom: spacing.sm,
      textAlign: 'center',
   },
   retryText: {
      fontSize: typography.fontSize.sm,
      color: colors.accent.primary,
   },
});
