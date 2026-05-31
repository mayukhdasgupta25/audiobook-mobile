import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, colors, shadows, spacing } from '@/theme';

const COVER_WIDTH = 72;
const COVER_HEIGHT = 96;
const PLAY_BUTTON_SIZE = 44;

interface SkeletonTrendingListProps {
   count?: number;
}

/** Matches the home screen "New and Trending" row card layout. */
export function SkeletonTrendingList({ count = 3 }: SkeletonTrendingListProps) {
   return (
      <View style={styles.list}>
         {Array.from({ length: count }).map((_, index) => (
            <View
               key={index}
               style={[styles.card, index === count - 1 && styles.cardLast]}
            >
               <SkeletonBox
                  width={COVER_WIDTH}
                  height={COVER_HEIGHT}
                  borderRadius={borderRadius.lg}
               />
               <View style={styles.body}>
                  <SkeletonText width="90%" height={16} />
                  <SkeletonText width="60%" height={12} style={styles.authorLine} />
               </View>
               <SkeletonBox
                  width={PLAY_BUTTON_SIZE}
                  height={PLAY_BUTTON_SIZE}
                  borderRadius={PLAY_BUTTON_SIZE / 2}
               />
            </View>
         ))}
      </View>
   );
}

const styles = StyleSheet.create({
   list: {
      paddingHorizontal: spacing.md,
   },
   card: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 112,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.background.card,
      ...shadows.sm,
   },
   cardLast: {
      marginBottom: 0,
   },
   body: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      marginHorizontal: spacing.md,
   },
   authorLine: {
      marginTop: spacing.xs,
   },
});
