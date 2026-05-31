import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, colors, spacing } from '@/theme';

interface SkeletonBookmarkRowProps {
   count?: number;
}

/** Full-width bookmark list row skeleton. */
export function SkeletonBookmarkRow({ count = 6 }: SkeletonBookmarkRowProps) {
   return (
      <>
         {Array.from({ length: count }).map((_, index) => (
            <View key={index}>
               <View style={styles.row}>
                  <SkeletonBox shape="square" size={56} borderRadius={borderRadius.md} />
                  <View style={styles.textBlock}>
                     <SkeletonText width="35%" height={10} />
                     <SkeletonText width="85%" height={14} style={styles.line} />
                     <SkeletonText width="60%" height={10} style={styles.line} />
                  </View>
               </View>
               <View style={styles.divider} />
            </View>
         ))}
      </>
   );
}

const styles = StyleSheet.create({
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.background.card,
   },
   textBlock: {
      flex: 1,
      marginLeft: spacing.md,
      gap: spacing.xs,
   },
   line: {
      marginTop: spacing.xs,
   },
   divider: {
      height: 1,
      backgroundColor: colors.background.highlight,
   },
});
