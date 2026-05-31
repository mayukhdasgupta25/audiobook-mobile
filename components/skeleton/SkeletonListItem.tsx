import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { spacing } from '@/theme';

interface SkeletonListItemProps {
   coverSize?: number;
   count?: number;
}

export function SkeletonListItem({ coverSize = 56, count = 1 }: SkeletonListItemProps) {
   return (
      <>
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.row}>
               <SkeletonBox
                  width={coverSize}
                  height={coverSize}
                  borderRadius={coverSize <= 40 ? coverSize / 2 : 8}
               />
               <View style={styles.textBlock}>
                  <SkeletonText width="75%" height={14} />
                  <SkeletonText width="50%" height={12} style={styles.subtitle} />
               </View>
            </View>
         ))}
      </>
   );
}

const styles = StyleSheet.create({
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.md,
   },
   textBlock: {
      flex: 1,
      gap: spacing.xs,
   },
   subtitle: {
      marginTop: spacing.xs,
   },
});
