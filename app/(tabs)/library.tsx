import React, { useCallback, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { PlaylistCard } from '@/components/PlaylistCard';
import { ContentCard } from '@/components/ContentCard';
import { BookmarkChapterCard } from '@/components/BookmarkChapterCard';
import { CreatePlaylistModal } from '@/components/CreatePlaylistModal';
import { LibrarySectionHeader } from '@/components/LibrarySectionHeader';
import { LibraryHorizontalRow } from '@/components/LibraryHorizontalRow';
import { colors, spacing, typography } from '@/theme';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';
import { LIBRARY_PREVIEW_LIMIT } from '@/constants/library';
import { usePlaylists, usePlaylistMutations } from '@/hooks/usePlaylists';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteAudiobooks } from '@/hooks/useFavoriteAudiobooks';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayBookmarkChapter } from '@/hooks/usePlayBookmarkChapter';
import { apiConfig } from '@/services/api';
import { getBookmarkAudiobookId } from '@/utils/bookmarkDisplay';

function LibraryScreenContent() {
   const insets = useSafeAreaInsets();
   const [createModalVisible, setCreateModalVisible] = useState(false);

   const {
      data: playlistsData,
      isLoading: playlistsLoading,
      error: playlistsError,
   } = usePlaylists(LIBRARY_PREVIEW_LIMIT);
   const {
      data: favoritesData,
      isLoading: favoritesLoading,
      error: favoritesError,
   } = useFavorites(LIBRARY_PREVIEW_LIMIT);
   const {
      data: bookmarksData,
      isLoading: bookmarksLoading,
      error: bookmarksError,
   } = useBookmarks(LIBRARY_PREVIEW_LIMIT);

   const { create } = usePlaylistMutations();
   const playlists = playlistsData?.data ?? [];
   const favorites = favoritesData?.data ?? [];
   const bookmarks = bookmarksData?.data ?? [];
   const { books: favoriteBooks, isLoading: favoriteBooksLoading } =
      useFavoriteAudiobooks(favorites);
   const { playBookmark } = usePlayBookmarkChapter();

   const handlePlaylistPress = useCallback((playlistId: string) => {
      router.push(`/playlists/${playlistId}` as never);
   }, []);

   const handleCreate = useCallback(
      (name: string, description: string) => {
         create.mutate(
            { name, description },
            {
               onSuccess: (res) => {
                  setCreateModalVisible(false);
                  router.push(`/playlists/${res.data.id}` as never);
               },
            }
         );
      },
      [create]
   );

   const scrollPadding = getTabScreenPaddingBottom(insets.bottom);

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.header}>
            <View>
               <Text style={styles.title}>Library</Text>
               <Text style={styles.subtitle}>Your collections</Text>
            </View>
         </View>

         <ScrollView
            contentContainerStyle={{ paddingBottom: scrollPadding }}
            showsVerticalScrollIndicator={false}
         >
            <LibrarySectionHeader
               title="Playlists"
               onSeeAll={() => router.push('/library/playlists' as never)}
               onAdd={() => setCreateModalVisible(true)}
            />
            <LibraryHorizontalRow
               isLoading={playlistsLoading}
               isEmpty={!playlistsError && playlists.length === 0}
               emptyMessage="No playlists yet. Tap + to create one."
            >
               {playlists.map((playlist) => (
                  <PlaylistCard
                     key={playlist.id}
                     playlist={playlist}
                     onPress={() => handlePlaylistPress(playlist.id)}
                  />
               ))}
            </LibraryHorizontalRow>
            {playlistsError ? (
               <Text style={styles.sectionError}>Unable to load playlists</Text>
            ) : null}

            <LibrarySectionHeader
               title="Favorites"
               onSeeAll={() => router.push('/library/favorites' as never)}
            />
            <LibraryHorizontalRow
               isLoading={favoritesLoading || favoriteBooksLoading}
               isEmpty={
                  !favoritesError &&
                  favorites.length === 0 &&
                  favoriteBooks.length === 0
               }
               emptyMessage="No favorites yet. Heart an audiobook to save it here."
            >
               {favoriteBooks.map((book) => {
                  const coverPath = book.contentCardCoverImage || book.coverImage;
                  const imageUri = coverPath
                     ? `${apiConfig.baseURL}${coverPath}`
                     : undefined;
                  return (
                     <View key={book.id} style={styles.favoriteCardWrap}>
                        <ContentCard
                           title={book.title}
                           imageUri={imageUri}
                           onPress={() => router.push(`/details/${book.id}` as never)}
                           cardWidth={140}
                        />
                     </View>
                  );
               })}
            </LibraryHorizontalRow>
            {favoritesError ? (
               <Text style={styles.sectionError}>Unable to load favorites</Text>
            ) : null}

            <LibrarySectionHeader
               title="Bookmarks"
               onSeeAll={() => router.push('/library/bookmarks' as never)}
            />
            <LibraryHorizontalRow
               isLoading={bookmarksLoading}
               isEmpty={!bookmarksError && bookmarks.length === 0}
               emptyMessage="No bookmarks yet. Bookmark a chapter while listening."
            >
               {bookmarks.map((bookmark) => {
                  const audiobookId = getBookmarkAudiobookId(bookmark);
                  return (
                     <BookmarkChapterCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onPress={
                           audiobookId
                              ? () => void playBookmark(bookmark)
                              : undefined
                        }
                     />
                  );
               })}
            </LibraryHorizontalRow>
            {bookmarksError ? (
               <Text style={styles.sectionError}>Unable to load bookmarks</Text>
            ) : null}
         </ScrollView>

         <CreatePlaylistModal
            visible={createModalVisible}
            onClose={() => setCreateModalVisible(false)}
            onCreate={handleCreate}
            isPending={create.isPending}
         />
      </SafeAreaView>
   );
}

export default function LibraryScreen() {
   return (
      <AnimatedTabScreen direction="right" currentRoute="library">
         <LibraryScreenContent />
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
   favoriteCardWrap: {
      marginRight: spacing.sm,
   },
   sectionError: {
      fontSize: typography.fontSize.sm,
      color: colors.error,
      paddingHorizontal: spacing.md,
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
   },
});
