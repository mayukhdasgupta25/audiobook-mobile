import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { spacing } from '@/theme';

interface SkeletonContentRowProps {
   cardWidth?: number;
   cardCount?: number;
   /** When true, omit the built-in title bar (parent renders section title). */
   hideTitle?: boolean;
}

export function SkeletonContentRow({
   cardWidth = 140,
   cardCount = 4,
   hideTitle = false,
}: SkeletonContentRowProps) {
   const cardHeight = Math.round(cardWidth / 0.7);

   return (
      <View style={[styles.container, hideTitle && styles.containerInline]}>
         {!hideTitle ? (
            <SkeletonText width={120} height={18} style={styles.title} />
         ) : null}
         <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
         >
            {Array.from({ length: cardCount }).map((_, index) => (
               <View key={index} style={[styles.card, { width: cardWidth }]}>
                  <SkeletonBox width={cardWidth} height={cardHeight} borderRadius={12} />
                  <SkeletonText width="85%" height={12} style={styles.cardTitle} />
               </View>
            ))}
         </ScrollView>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      marginBottom: spacing.lg,
   },
   containerInline: {
      marginBottom: 0,
   },
   title: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   row: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
   },
   card: {
      marginRight: spacing.sm,
   },
   cardTitle: {
      marginTop: spacing.sm,
   },
});
