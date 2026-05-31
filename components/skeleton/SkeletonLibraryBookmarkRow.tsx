import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BOOKMARK_CARD_WIDTH } from '@/components/BookmarkChapterCard';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

const COVER_HEIGHT = 88;

interface SkeletonLibraryBookmarkRowProps {
   count?: number;
}

/** Horizontal bookmark card skeleton for the library tab preview row. */
export function SkeletonLibraryBookmarkRow({ count = 8 }: SkeletonLibraryBookmarkRowProps) {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         row: {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
         },
         card: {
            width: BOOKMARK_CARD_WIDTH,
            marginRight: spacing.sm,
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
         },
         textBlock: {
            padding: spacing.sm,
            gap: spacing.xs,
         },
         line: {
            marginTop: spacing.xs,
         },
      })
   );

   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.row}
      >
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.card}>
               <SkeletonBox
                  width={BOOKMARK_CARD_WIDTH}
                  height={COVER_HEIGHT}
                  borderRadius={0}
               />
               <View style={styles.textBlock}>
                  <SkeletonText width="40%" height={10} />
                  <SkeletonText width="90%" height={12} style={styles.line} />
                  <SkeletonText width="70%" height={10} style={styles.line} />
               </View>
            </View>
         ))}
      </ScrollView>
   );
}
