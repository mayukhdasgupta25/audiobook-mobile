import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, colors, spacing } from '@/theme';

interface SkeletonMoodAudiobookRowProps {
   count?: number;
}

export function SkeletonMoodAudiobookRow({ count = 4 }: SkeletonMoodAudiobookRowProps) {
   return (
      <>
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.row}>
               <SkeletonBox shape="square" size={56} borderRadius={borderRadius.md} />
               <View style={styles.body}>
                  <SkeletonText width="85%" height={14} />
                  <SkeletonText width="60%" height={12} style={styles.line} />
                  <SkeletonText width="35%" height={10} style={styles.line} />
               </View>
               <SkeletonBox shape="circle" size={36} />
            </View>
         ))}
      </>
   );
}

/** Recommendations block with section header and card wrapper. */
export function SkeletonMoodRecommendations({ count = 4 }: { count?: number }) {
   return (
      <View style={recStyles.section}>
         <View style={recStyles.header}>
            <SkeletonText width="70%" height={18} />
            <SkeletonText width={56} height={12} />
         </View>
         <View style={recStyles.card}>
            <SkeletonMoodAudiobookRow count={count} />
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
   },
   body: {
      flex: 1,
      marginHorizontal: spacing.md,
   },
   line: {
      marginTop: spacing.xs,
   },
});

const recStyles = StyleSheet.create({
   section: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.md,
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
   },
   card: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
   },
});
