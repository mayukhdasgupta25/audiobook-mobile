import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { colors, spacing } from '@/theme';

interface SkeletonChapterRowProps {
   count?: number;
   showDownloadAction?: boolean;
}

export function SkeletonChapterRow({
   count = 6,
   showDownloadAction = true,
}: SkeletonChapterRowProps) {
   return (
      <>
         {Array.from({ length: count }).map((_, index) => (
            <View key={index}>
               <View style={styles.row}>
                  <SkeletonText width={28} height={14} />
                  <View style={styles.info}>
                     <SkeletonText width="75%" height={14} />
                     <SkeletonText width="35%" height={10} style={styles.duration} />
                  </View>
                  <View style={styles.actions}>
                     {showDownloadAction ? (
                        <SkeletonBox shape="square" size={28} borderRadius={4} />
                     ) : null}
                     <SkeletonBox shape="circle" size={32} />
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
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      paddingLeft: spacing.md + 4,
      backgroundColor: colors.background.screen,
   },
   info: {
      flex: 1,
      marginHorizontal: spacing.sm,
   },
   duration: {
      marginTop: 2,
   },
   actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
   },
   divider: {
      height: 1,
      backgroundColor: colors.background.highlight,
      marginLeft: spacing.md,
   },
});
