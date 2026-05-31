import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, colors, spacing } from '@/theme';

const CARD_WIDTH = 260;

interface SkeletonMoodBestForRowProps {
   count?: number;
}

export function SkeletonMoodBestForRow({ count = 3 }: SkeletonMoodBestForRowProps) {
   return (
      <View style={styles.section}>
         <SkeletonText width={100} height={18} style={styles.title} />
         <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
         >
            {Array.from({ length: count }).map((_, index) => (
               <View key={index} style={styles.card}>
                  <SkeletonBox shape="square" size={24} borderRadius={borderRadius.sm} />
                  <View style={styles.textBlock}>
                     <SkeletonText width="80%" height={14} />
                     <SkeletonText width="95%" height={12} style={styles.line} />
                     <SkeletonText width="70%" height={12} style={styles.line} />
                  </View>
               </View>
            ))}
         </ScrollView>
      </View>
   );
}

const styles = StyleSheet.create({
   section: {
      marginTop: spacing.lg,
   },
   title: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   row: {
      paddingHorizontal: spacing.md,
   },
   card: {
      flexDirection: 'row',
      alignItems: 'center',
      width: CARD_WIDTH,
      minHeight: 88,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginRight: spacing.md,
      backgroundColor: colors.background.screen,
   },
   textBlock: {
      flex: 1,
      marginLeft: spacing.md,
   },
   line: {
      marginTop: spacing.xs,
   },
});
