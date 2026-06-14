import React, { useMemo } from 'react';
import {
   ScrollView,
   StyleSheet,
   RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { LibraryScreenLayout } from '@/components/library/LibraryScreenLayout';
import { LibraryListCard } from '@/components/library/LibraryListCard';
import { AudiobookLibraryRow } from '@/components/library/AudiobookLibraryRow';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { SkeletonBookmarkRow } from '@/components/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteAudiobooks } from '@/hooks/useFavoriteAudiobooks';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function LibraryFavoritesScreen() {
   const { colors } = useTheme();
   const styles = StyleSheet.create({
      scrollContent: {
         paddingBottom: spacing.xl,
      },
   });

   const { data, isLoading, refetch, isRefetching } = useFavorites();
   const favorites = data?.data ?? [];
   const { books, isLoading: booksLoading } = useFavoriteAudiobooks(favorites);

   const loading = isLoading || (favorites.length > 0 && booksLoading);

   const refreshFns = useMemo(() => [refetch], [refetch]);
   const { refreshing, onRefresh } = usePullToRefresh(refreshFns, { isRefetching });

   return (
      <LibraryScreenLayout headerIcon="favorites" onBack={() => router.back()}>
         {loading && books.length === 0 ? (
            <SkeletonBookmarkRow count={6} />
         ) : favorites.length === 0 ? (
            <LibraryEmptyState
               title="No favorites yet"
               hint="Heart an audiobook on its details page to save it here."
            />
         ) : (
            <ScrollView
               contentContainerStyle={styles.scrollContent}
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
               <LibraryListCard>
                  {books.map((book) => (
                     <AudiobookLibraryRow
                        key={book.id}
                        audiobook={book}
                        onPress={() => router.push(`/details/${book.id}` as never)}
                     />
                  ))}
               </LibraryListCard>
            </ScrollView>
         )}
      </LibraryScreenLayout>
   );
}
