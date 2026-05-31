import React, { useCallback, useState, useRef } from 'react';
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
import { spacing, typography } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';
import { LIBRARY_PREVIEW_LIMIT } from '@/constants/library';
import { usePlaylists, usePlaylistMutations } from '@/hooks/usePlaylists';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteAudiobooks } from '@/hooks/useFavoriteAudiobooks';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayBookmarkChapter } from '@/hooks/usePlayBookmarkChapter';
import { apiConfig } from '@/services/api';
import { getBookmarkAudiobookId } from '@/utils/bookmarkDisplay';
import { useTabScrollToTop } from '@/hooks/useTabScrollToTop';

function LibraryScreenContent() {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flex: 1,
            backgroundColor: t.colors.background.screen,
         },
         header: {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.sm,
         },
         title: {
            fontSize: typography.fontSize['2xl'],
            fontWeight: '700',
            color: t.colors.text.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         subtitle: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginTop: spacing.xs,
         },
         favoriteCardWrap: {
            marginRight: spacing.sm,
         },
      })
   );
   const scrollRef = useRef<ScrollView>(null);
   const insets = useSafeAreaInsets();
   const [createModalVisible, setCreateModalVisible] = useState(false);

   const {
      data: playlistsData,
      isLoading: playlistsLoading,
   } = usePlaylists(LIBRARY_PREVIEW_LIMIT);
   const {
      data: favoritesData,
      isLoading: favoritesLoading,
   } = useFavorites(LIBRARY_PREVIEW_LIMIT);
   const {
      data: bookmarksData,
      isLoading: bookmarksLoading,
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

   useTabScrollToTop('library', scrollRef);

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.header}>
            <View>
               <Text style={styles.title}>Library</Text>
               <Text style={styles.subtitle}>Your collections</Text>
            </View>
         </View>

         <ScrollView
            ref={scrollRef}
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
               isEmpty={playlists.length === 0}
               emptyMessage="No playlists yet. Tap + to create one."
               skeletonVariant="playlist"
            >
               {playlists.map((playlist) => (
                  <PlaylistCard
                     key={playlist.id}
                     playlist={playlist}
                     onPress={() => handlePlaylistPress(playlist.id)}
                  />
               ))}
            </LibraryHorizontalRow>

            <LibrarySectionHeader
               title="Favorites"
               onSeeAll={() => router.push('/library/favorites' as never)}
            />
            <LibraryHorizontalRow
               isLoading={favoritesLoading || favoriteBooksLoading}
               isEmpty={favorites.length === 0 && favoriteBooks.length === 0}
               emptyMessage="No favorites yet. Heart an audiobook to save it here."
               skeletonVariant="favorite"
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

            <LibrarySectionHeader
               title="Bookmarks"
               onSeeAll={() => router.push('/library/bookmarks' as never)}
            />
            <LibraryHorizontalRow
               isLoading={bookmarksLoading}
               isEmpty={bookmarks.length === 0}
               emptyMessage="No bookmarks yet. Bookmark a chapter while listening."
               skeletonVariant="bookmark"
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
