import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { spacing } from '@/theme';

export function SkeletonProfileCard() {
   return (
      <View style={styles.container}>
         <SkeletonBox width={72} height={72} borderRadius={36} />
         <View style={styles.statsRow}>
            {[0, 1, 2].map((index) => (
               <View key={index} style={styles.stat}>
                  <SkeletonText width={48} height={16} />
                  <SkeletonText width={64} height={12} style={styles.statLabel} />
               </View>
            ))}
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      alignItems: 'center',
      padding: spacing.lg,
      gap: spacing.lg,
   },
   statsRow: {
      flexDirection: 'row',
      gap: spacing.xl,
   },
   stat: {
      alignItems: 'center',
      gap: spacing.xs,
   },
   statLabel: {
      marginTop: spacing.xs,
   },
});
