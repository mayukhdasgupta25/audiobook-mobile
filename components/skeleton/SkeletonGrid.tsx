import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { GRID_GAP, GRID_PADDING, NUM_COLUMNS } from '@/components/AudiobookGridCard';
import { spacing } from '@/theme';

interface SkeletonGridProps {
   rows?: number;
   cardAspect?: number;
}

export function SkeletonGrid({ rows = 3, cardAspect = 1.35 }: SkeletonGridProps) {
   const itemCount = rows * NUM_COLUMNS;
   const availableWidth = 360 - GRID_PADDING * 2;
   const cardWidth = (availableWidth - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
   const cardHeight = Math.round(cardWidth * cardAspect);

   return (
      <View style={styles.grid}>
         {Array.from({ length: itemCount }).map((_, index) => (
            <View key={index} style={[styles.item, { width: cardWidth }]}>
               <SkeletonBox width={cardWidth} height={cardHeight} borderRadius={12} />
               <SkeletonText width="80%" height={12} style={styles.title} />
            </View>
         ))}
      </View>
   );
}

const styles = StyleSheet.create({
   grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: GRID_PADDING,
      gap: GRID_GAP,
   },
   item: {
      marginBottom: GRID_GAP,
   },
   title: {
      marginTop: spacing.sm,
   },
});
