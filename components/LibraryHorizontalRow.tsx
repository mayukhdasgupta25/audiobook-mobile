import React from 'react';
import {
   View,
   Text,
   ScrollView,
   StyleSheet,
} from 'react-native';
import {
   SkeletonLibraryBookmarkRow,
   SkeletonLibraryFavoriteRow,
   SkeletonLibraryPlaylistRow,
} from '@/components/skeleton';
import { colors, spacing, typography } from '@/theme';
import { LIBRARY_PREVIEW_LIMIT } from '@/constants/library';

export type LibraryRowSkeletonVariant = 'playlist' | 'favorite' | 'bookmark';

interface LibraryHorizontalRowProps {
   isLoading?: boolean;
   isEmpty?: boolean;
   emptyMessage?: string;
   skeletonVariant?: LibraryRowSkeletonVariant;
   children: React.ReactNode;
}

function LibraryRowSkeleton({ variant }: { variant: LibraryRowSkeletonVariant }) {
   switch (variant) {
      case 'favorite':
         return <SkeletonLibraryFavoriteRow count={LIBRARY_PREVIEW_LIMIT} />;
      case 'bookmark':
         return <SkeletonLibraryBookmarkRow count={LIBRARY_PREVIEW_LIMIT} />;
      case 'playlist':
      default:
         return <SkeletonLibraryPlaylistRow count={LIBRARY_PREVIEW_LIMIT} />;
   }
}

export const LibraryHorizontalRow: React.FC<LibraryHorizontalRowProps> = ({
   isLoading = false,
   isEmpty = false,
   emptyMessage = 'Nothing here yet',
   skeletonVariant = 'playlist',
   children,
}) => {
   if (isLoading) {
      return <LibraryRowSkeleton variant={skeletonVariant} />;
   }

   if (isEmpty) {
      return (
         <View style={styles.center}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
         </View>
      );
   }

   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.scrollContent}
      >
         {children}
      </ScrollView>
   );
};

const styles = StyleSheet.create({
   scrollContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
   },
   center: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      minHeight: 100,
      justifyContent: 'center',
   },
   emptyText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
   },
});
