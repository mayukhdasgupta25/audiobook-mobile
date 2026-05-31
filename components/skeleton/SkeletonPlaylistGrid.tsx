import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
   AUDIOBOOK_GRID_CARD_WIDTH,
   GRID_GAP,
   GRID_PADDING,
   NUM_COLUMNS,
} from '@/components/AudiobookGridCard';
import { PLAYLIST_CARD_WIDTH } from '@/components/PlaylistCard';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

interface SkeletonPlaylistGridProps {
   rows?: number;
}

/** Grid of playlist icon cards (not cover art). */
export function SkeletonPlaylistGrid({ rows = 3 }: SkeletonPlaylistGridProps) {
   const itemCount = rows * NUM_COLUMNS;
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: GRID_PADDING,
            gap: GRID_GAP,
         },
         card: {
            marginBottom: GRID_GAP,
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
         },
         line: {
            marginTop: spacing.sm,
         },
         searchGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: GRID_GAP,
         },
         searchCard: {
            borderRadius: borderRadius.md,
            overflow: 'hidden',
            backgroundColor: t.colors.background.card,
            marginBottom: spacing.xs,
         },
         searchFooter: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            alignItems: 'center',
         },
      })
   );

   return (
      <View style={styles.grid}>
         {Array.from({ length: itemCount }).map((_, index) => (
            <View key={index} style={[styles.card, { width: PLAYLIST_CARD_WIDTH }]}>
               <SkeletonBox shape="square" size={48} borderRadius={borderRadius.md} />
               <SkeletonText width="90%" height={14} style={styles.line} />
               <SkeletonText width="70%" height={12} style={styles.line} />
            </View>
         ))}
      </View>
   );
}

/** Compact audiobook grid for search results on playlist detail. */
export function SkeletonPlaylistSearchGrid({ rows = 2 }: { rows?: number }) {
   const itemCount = rows * NUM_COLUMNS;
   const cardWidth = AUDIOBOOK_GRID_CARD_WIDTH;
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: GRID_PADDING,
            gap: GRID_GAP,
         },
         card: {
            marginBottom: GRID_GAP,
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
         },
         line: {
            marginTop: spacing.sm,
         },
         searchGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: GRID_GAP,
         },
         searchCard: {
            borderRadius: borderRadius.md,
            overflow: 'hidden',
            backgroundColor: t.colors.background.card,
            marginBottom: spacing.xs,
         },
         searchFooter: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            alignItems: 'center',
         },
      })
   );

   return (
      <View style={styles.searchGrid}>
         {Array.from({ length: itemCount }).map((_, index) => (
            <View key={index} style={[styles.searchCard, { width: cardWidth }]}>
               <SkeletonBox
                  width={cardWidth}
                  height={Math.round(cardWidth / 0.7)}
                  borderRadius={borderRadius.md}
               />
               <View style={styles.searchFooter}>
                  <SkeletonText width="85%" height={12} />
               </View>
            </View>
         ))}
      </View>
   );
}
