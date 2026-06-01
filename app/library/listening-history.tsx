import React, { useCallback } from 'react';
import {
   ScrollView,
   StyleSheet,
   View,
   ActivityIndicator,
   TouchableOpacity,
   Text,
   Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LibraryScreenLayout } from '@/components/library/LibraryScreenLayout';
import { LibraryListCard } from '@/components/library/LibraryListCard';
import { ListeningHistoryRow } from '@/components/library/ListeningHistoryRow';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { SkeletonBookmarkRow } from '@/components/skeleton';
import { useListeningHistory } from '@/hooks/useListeningHistory';
import { useListeningHistoryAudiobooks } from '@/hooks/useListeningHistoryAudiobooks';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export default function LibraryListeningHistoryScreen() {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         scrollContent: {
            paddingBottom: spacing.xl,
         },
         center: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
         },
         retryText: {
            fontSize: typography.fontSize.base,
            color: t.colors.accent.primary,
            fontWeight: '500',
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '500' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
      })
   );

   const { data: entries = [], isLoading, isError, error, refetch, isRefetching } =
      useListeningHistory();
   const { items, isLoading: booksLoading } = useListeningHistoryAudiobooks(entries);

   const loading = isLoading || (entries.length > 0 && booksLoading);

   const handleItemPress = useCallback((audiobookId: string) => {
      router.push(`/details/${audiobookId}` as never);
   }, []);

   return (
      <LibraryScreenLayout headerIcon="listening-history" onBack={() => router.back()}>
         {loading && entries.length === 0 ? (
            <SkeletonBookmarkRow count={6} />
         ) : isError ? (
            <View style={styles.center}>
               <LibraryEmptyState
                  title="Could not load history"
                  hint={getApiErrorMessage(error, 'Something went wrong. Please try again.')}
               />
               <TouchableOpacity onPress={() => refetch()} activeOpacity={0.7}>
                  <Text style={styles.retryText}>Retry</Text>
               </TouchableOpacity>
            </View>
         ) : entries.length === 0 ? (
            <LibraryEmptyState
               title="No listening history yet"
               hint="Titles you listen to will appear here."
            />
         ) : (
            <ScrollView
               contentContainerStyle={styles.scrollContent}
               showsVerticalScrollIndicator={false}
            >
               {isRefetching ? (
                  <ActivityIndicator
                     color={colors.accent.primary}
                     style={{ marginBottom: spacing.md }}
                  />
               ) : null}
               <LibraryListCard>
                  {items.map((item) => (
                     <ListeningHistoryRow
                        key={item.entry.id}
                        entry={item.entry}
                        audiobook={item.audiobook}
                        onPress={() => handleItemPress(item.entry.audiobookId)}
                     />
                  ))}
               </LibraryListCard>
            </ScrollView>
         )}
      </LibraryScreenLayout>
   );
}
