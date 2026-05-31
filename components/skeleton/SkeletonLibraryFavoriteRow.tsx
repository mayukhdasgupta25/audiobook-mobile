import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { portraitCoverHeight } from './skeletonLayout';
import { borderRadius, spacing } from '@/theme';

const CARD_WIDTH = 140;

interface SkeletonLibraryFavoriteRowProps {
   count?: number;
}

export function SkeletonLibraryFavoriteRow({ count = 8 }: SkeletonLibraryFavoriteRowProps) {
   const cardHeight = portraitCoverHeight(CARD_WIDTH);

   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.row}
      >
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={[styles.card, { width: CARD_WIDTH }]}>
               <SkeletonBox
                  width={CARD_WIDTH}
                  height={cardHeight}
                  borderRadius={borderRadius.md}
               />
               <SkeletonText width="90%" height={12} style={styles.line} />
               <SkeletonText width="75%" height={12} style={styles.line} />
            </View>
         ))}
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   row: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
   },
   card: {
      marginRight: spacing.sm,
   },
   line: {
      marginTop: spacing.xs,
   },
});
