import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { portraitCoverHeight } from './skeletonLayout';
import {
   AUDIOBOOK_GRID_CARD_WIDTH,
   GRID_GAP,
   GRID_PADDING,
   NUM_COLUMNS,
} from '@/components/AudiobookGridCard';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

interface SkeletonGridProps {
   rows?: number;
   /** When set, overrides default portrait aspect (0.7). */
   cardAspect?: number;
}

export function SkeletonGrid({ rows = 3, cardAspect }: SkeletonGridProps) {
   const itemCount = rows * NUM_COLUMNS;
   const cardWidth = AUDIOBOOK_GRID_CARD_WIDTH;
   const cardHeight =
      cardAspect !== undefined
         ? Math.round(cardWidth * cardAspect)
         : portraitCoverHeight(cardWidth);
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: GRID_PADDING,
            gap: GRID_GAP,
         },
         card: {
            marginBottom: spacing.xs,
            borderRadius: borderRadius.md,
            overflow: 'hidden',
            backgroundColor: t.colors.background.card,
         },
         footer: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            alignItems: 'center',
            gap: spacing.xs,
         },
         footerLine: {
            marginTop: 2,
         },
      })
   );

   return (
      <View style={styles.grid}>
         {Array.from({ length: itemCount }).map((_, index) => (
            <View key={index} style={[styles.card, { width: cardWidth }]}>
               <SkeletonBox
                  width={cardWidth}
                  height={cardHeight}
                  borderRadius={borderRadius.md}
               />
               <View style={styles.footer}>
                  <SkeletonText width="90%" height={12} />
                  <SkeletonText width="70%" height={12} style={styles.footerLine} />
               </View>
            </View>
         ))}
      </View>
   );
}
