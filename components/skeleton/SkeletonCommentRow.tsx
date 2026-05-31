import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing } from '@/theme';

interface SkeletonCommentRowProps {
   count?: number;
}

export function SkeletonCommentRow({ count = 6 }: SkeletonCommentRowProps) {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         row: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
         },
         main: {
            flex: 1,
            minWidth: 0,
         },
         line: {
            marginTop: spacing.xs,
         },
         actions: {
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing.sm,
         },
         divider: {
            height: 1,
            backgroundColor: t.colors.background.highlight,
         },
      })
   );

   return (
      <>
         {Array.from({ length: count }).map((_, index) => (
            <View key={index}>
               <View style={styles.row}>
                  <View style={styles.main}>
                     <SkeletonText width="95%" height={14} />
                     <SkeletonText width="80%" height={14} style={styles.line} />
                     <View style={styles.actions}>
                        <SkeletonText width={40} height={12} />
                        <SkeletonText width={88} height={12} />
                     </View>
                  </View>
                  <SkeletonText width={72} height={10} />
               </View>
               <View style={styles.divider} />
            </View>
         ))}
      </>
   );
}
