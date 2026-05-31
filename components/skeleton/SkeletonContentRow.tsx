import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { portraitCoverHeight } from './skeletonLayout';
import { borderRadius, spacing } from '@/theme';

interface SkeletonContentRowProps {
   cardWidth?: number;
   cardCount?: number;
   /** When true, omit the built-in title bar (parent renders section title). */
   hideTitle?: boolean;
   /** Section title skeleton width when hideTitle is false. */
   titleWidth?: number;
   style?: ViewStyle;
}

export function SkeletonContentRow({
   cardWidth = 140,
   cardCount = 4,
   hideTitle = false,
   titleWidth = 120,
   style,
}: SkeletonContentRowProps) {
   const cardHeight = portraitCoverHeight(cardWidth);

   return (
      <View style={[styles.container, hideTitle && styles.containerInline, style]}>
         {!hideTitle ? (
            <SkeletonText width={titleWidth} height={18} style={styles.title} />
         ) : null}
         <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
         >
            {Array.from({ length: cardCount }).map((_, index) => (
               <View key={index} style={[styles.card, { width: cardWidth }]}>
                  <SkeletonBox
                     width={cardWidth}
                     height={cardHeight}
                     borderRadius={borderRadius.md}
                  />
                  <SkeletonText width="85%" height={12} style={styles.cardTitle} />
                  <SkeletonText width="65%" height={12} style={styles.cardSubtitle} />
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
      marginTop: spacing.xs,
   },
   cardSubtitle: {
      marginTop: spacing.xs,
   },
});
