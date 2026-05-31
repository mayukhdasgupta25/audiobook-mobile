import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { spacing } from '@/theme';

interface SkeletonMoodChipsProps {
   count?: number;
}

export function SkeletonMoodChips({ count = 5 }: SkeletonMoodChipsProps) {
   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.row}
      >
         {Array.from({ length: count }).map((_, index) => (
            <SkeletonBox
               key={index}
               width={index % 2 === 0 ? 88 : 104}
               height={36}
               borderRadius={18}
            />
         ))}
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   row: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      paddingBottom: spacing.sm,
   },
});
