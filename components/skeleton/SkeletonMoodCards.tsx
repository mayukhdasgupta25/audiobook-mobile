import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, spacing } from '@/theme';

const MOOD_CARD_WIDTH = 76;
const MOOD_ICON_SIZE = 44;

interface SkeletonMoodCardsProps {
   count?: number;
}

/** Matches MoodChip variant="card" on the home screen. */
export function SkeletonMoodCards({ count = 5 }: SkeletonMoodCardsProps) {
   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.row}
      >
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.card}>
               <SkeletonBox
                  width={MOOD_ICON_SIZE}
                  height={MOOD_ICON_SIZE}
                  borderRadius={borderRadius.md}
               />
               <SkeletonText width={56} height={10} style={styles.label} />
            </View>
         ))}
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   row: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
   },
   card: {
      width: MOOD_CARD_WIDTH,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      marginRight: spacing.sm,
   },
   label: {
      marginTop: spacing.xs,
   },
});
