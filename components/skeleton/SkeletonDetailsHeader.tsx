import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, spacing } from '@/theme';

interface SkeletonDetailsHeaderProps {
   showGenreChips?: boolean;
}

export function SkeletonDetailsHeader({ showGenreChips = true }: SkeletonDetailsHeaderProps) {
   return (
      <View style={styles.container}>
         <View style={styles.bookRow}>
            <SkeletonBox shape="square" size={88} borderRadius={borderRadius.lg} />
            <View style={styles.bookInfo}>
               <SkeletonText width="90%" height={16} />
               <SkeletonText width="65%" height={14} style={styles.line} />
               <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, index) => (
                     <SkeletonBox key={index} shape="square" size={14} borderRadius={2} />
                  ))}
               </View>
               <SkeletonText width="50%" height={10} style={styles.line} />
            </View>
         </View>
         <View style={styles.actionButtons}>
            <SkeletonBox width="48%" height={48} borderRadius={borderRadius.lg} />
            <SkeletonBox width="48%" height={48} borderRadius={borderRadius.lg} />
         </View>
         {showGenreChips ? (
            <View style={styles.chipsRow}>
               <SkeletonBox width={72} height={28} borderRadius={borderRadius.full} />
               <SkeletonBox width={88} height={28} borderRadius={borderRadius.full} />
            </View>
         ) : null}
      </View>
   );
}

/** About tab description skeleton. */
export function SkeletonDetailsAbout({ lines = 4 }: { lines?: number }) {
   return (
      <View style={styles.about}>
         {Array.from({ length: lines }).map((_, index) => (
            <SkeletonText
               key={index}
               width={index === lines - 1 ? '70%' : '100%'}
               height={14}
               style={styles.aboutLine}
            />
         ))}
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      paddingHorizontal: spacing.md,
   },
   bookRow: {
      flexDirection: 'row',
      gap: spacing.md,
   },
   bookInfo: {
      flex: 1,
      justifyContent: 'center',
   },
   line: {
      marginTop: spacing.xs,
   },
   starsRow: {
      flexDirection: 'row',
      gap: 4,
      marginTop: spacing.sm,
   },
   actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
   },
   chipsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
   },
   about: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
   },
   aboutLine: {
      marginBottom: spacing.sm,
   },
});
