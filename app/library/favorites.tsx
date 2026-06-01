import React from 'react';
import {
   ScrollView,
   StyleSheet,
   ActivityIndicator,
   View,
} from 'react-native';
import { router } from 'expo-router';
import { LibraryScreenLayout } from '@/components/library/LibraryScreenLayout';
import { LibraryListCard } from '@/components/library/LibraryListCard';
import { AudiobookLibraryRow } from '@/components/library/AudiobookLibraryRow';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { SkeletonBookmarkRow } from '@/components/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteAudiobooks } from '@/hooks/useFavoriteAudiobooks';
import { spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function LibraryFavoritesScreen() {
   const { colors } = useTheme();
   const styles = StyleSheet.create({
      scrollContent: {
         paddingBottom: spacing.xl,
      },
      loadingBanner: {
         marginBottom: spacing.md,
         alignItems: 'center',
      },
   });

   const { data, isLoading, isRefetching } = useFavorites();
   const favorites = data?.data ?? [];
   const { books, isLoading: booksLoading } = useFavoriteAudiobooks(favorites);

   const loading = isLoading || (favorites.length > 0 && booksLoading);

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
            >
               {isRefetching ? (
                  <View style={styles.loadingBanner}>
                     <ActivityIndicator color={colors.accent.primary} />
                  </View>
               ) : null}
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
