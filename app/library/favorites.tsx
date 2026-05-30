import React, { useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   ActivityIndicator,
   Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
   AudiobookGridCard,
   GRID_PADDING,
   GRID_GAP,
   NUM_COLUMNS,
} from '@/components/AudiobookGridCard';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteAudiobooks } from '@/hooks/useFavoriteAudiobooks';
import { Audiobook } from '@/services/audiobooks';
import { colors, spacing, typography } from '@/theme';

export default function LibraryFavoritesScreen() {
   const { data, isLoading, error } = useFavorites();
   const favorites = data?.data ?? [];
   const { books, isLoading: booksLoading } = useFavoriteAudiobooks(favorites);

   const renderItem = useCallback(
      ({ item }: { item: Audiobook }) => (
         <AudiobookGridCard
            item={item}
            onPress={() => router.push(`/details/${item.id}` as never)}
         />
      ),
      []
   );

   const loading = isLoading || booksLoading;

   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <ScreenHeader title="Favorites" onBack={() => router.back()} />

         {loading && books.length === 0 ? (
            <View style={styles.center}>
               <ActivityIndicator size="large" color={colors.accent.primary} />
            </View>
         ) : error ? (
            <View style={styles.center}>
               <Text style={styles.errorText}>Unable to load favorites</Text>
            </View>
         ) : (
            <FlatList
               data={books}
               keyExtractor={(item) => item.id}
               renderItem={renderItem}
               numColumns={NUM_COLUMNS}
               columnWrapperStyle={styles.columnWrapper}
               contentContainerStyle={styles.listContent}
               ListEmptyComponent={
                  <View style={styles.center}>
                     <Text style={styles.emptyText}>No favorites yet</Text>
                     <Text style={styles.emptyHint}>
                        Heart an audiobook on its details page to save it here.
                     </Text>
                  </View>
               }
            />
         )}
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   listContent: {
      paddingHorizontal: GRID_PADDING,
      paddingBottom: spacing.xxl,
   },
   columnWrapper: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
   },
   center: {
      flex: 1,
      padding: spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
   },
   emptyText: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      ...Platform.select({
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   emptyHint: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.sm,
      textAlign: 'center',
   },
   errorText: {
      color: colors.error,
   },
});
