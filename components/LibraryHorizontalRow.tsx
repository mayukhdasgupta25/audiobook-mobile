import React from 'react';
import {
   View,
   Text,
   ScrollView,
   StyleSheet,
} from 'react-native';
import { SkeletonBox } from '@/components/skeleton/SkeletonBox';
import { SkeletonText } from '@/components/skeleton/SkeletonText';
import { colors, spacing, typography } from '@/theme';

interface LibraryHorizontalRowProps {
   isLoading?: boolean;
   isEmpty?: boolean;
   emptyMessage?: string;
   children: React.ReactNode;
}

function LibraryRowSkeleton() {
   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.scrollContent}
      >
         {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
               <SkeletonBox width={140} height={140} borderRadius={12} />
               <SkeletonText width={100} height={12} style={styles.skeletonTitle} />
            </View>
         ))}
      </ScrollView>
   );
}

export const LibraryHorizontalRow: React.FC<LibraryHorizontalRowProps> = ({
   isLoading = false,
   isEmpty = false,
   emptyMessage = 'Nothing here yet',
   children,
}) => {
   if (isLoading) {
      return <LibraryRowSkeleton />;
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
   skeletonCard: {
      marginRight: spacing.sm,
   },
   skeletonTitle: {
      marginTop: spacing.sm,
   },
});
