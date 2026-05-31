import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PUBLISHER_CARD_WIDTH } from '@/components/PublisherCard';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, spacing } from '@/theme';

interface SkeletonPublisherRowProps {
   count?: number;
}

export function SkeletonPublisherRow({ count = 4 }: SkeletonPublisherRowProps) {
   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.row}
      >
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.card}>
               <SkeletonBox
                  width={PUBLISHER_CARD_WIDTH}
                  height={PUBLISHER_CARD_WIDTH}
                  borderRadius={borderRadius.lg}
               />
               <SkeletonText width={PUBLISHER_CARD_WIDTH - 16} height={12} style={styles.label} />
            </View>
         ))}
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   row: {
      paddingHorizontal: spacing.md,
   },
   card: {
      width: PUBLISHER_CARD_WIDTH,
      marginRight: spacing.sm,
   },
   label: {
      marginTop: spacing.xs,
   },
});
