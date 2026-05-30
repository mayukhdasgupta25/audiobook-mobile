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
import { BookmarkChapterCard } from '@/components/BookmarkChapterCard';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayBookmarkChapter } from '@/hooks/usePlayBookmarkChapter';
import { Bookmark } from '@/services/bookmarks';
import { getBookmarkAudiobookId } from '@/utils/bookmarkDisplay';
import { colors, spacing, typography } from '@/theme';

export default function LibraryBookmarksScreen() {
   const { data, isLoading, error } = useBookmarks();
   const bookmarks = data?.data ?? [];
   const { playBookmark } = usePlayBookmarkChapter();

   const renderItem = useCallback(
      ({ item }: { item: Bookmark }) => {
         const audiobookId = getBookmarkAudiobookId(item);
         return (
            <BookmarkChapterCard
               bookmark={item}
               variant="row"
               onPress={
                  audiobookId ? () => void playBookmark(item) : undefined
               }
            />
         );
      },
      [playBookmark]
   );

   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <ScreenHeader title="Bookmarks" onBack={() => router.back()} />

         {isLoading ? (
            <View style={styles.center}>
               <ActivityIndicator size="large" color={colors.accent.primary} />
            </View>
         ) : error ? (
            <View style={styles.center}>
               <Text style={styles.errorText}>Unable to load bookmarks</Text>
            </View>
         ) : (
            <FlatList
               data={bookmarks}
               keyExtractor={(item) => item.id}
               renderItem={renderItem}
               contentContainerStyle={styles.listContent}
               ListEmptyComponent={
                  <View style={styles.center}>
                     <Text style={styles.emptyText}>No bookmarks yet</Text>
                     <Text style={styles.emptyHint}>
                        Bookmark a chapter while listening to save it here.
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
      paddingBottom: spacing.xxl,
      flexGrow: 1,
   },
   center: {
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
