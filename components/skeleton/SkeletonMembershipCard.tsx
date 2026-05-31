import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { spacing } from '@/theme';

export function SkeletonMembershipCard() {
   return (
      <View style={styles.container}>
         <View style={styles.planHeader}>
            <SkeletonText width="55%" height={16} />
            <SkeletonBox width={64} height={20} borderRadius={10} />
         </View>
         <SkeletonText width="40%" height={14} style={styles.line} />
         <SkeletonText width="85%" height={14} style={styles.line} />
         <SkeletonText width="70%" height={14} style={styles.line} />
         <View style={styles.featureList}>
            {Array.from({ length: 3 }).map((_, index) => (
               <View key={index} style={styles.featureRow}>
                  <SkeletonBox shape="circle" size={18} />
                  <SkeletonText width="80%" height={14} />
               </View>
            ))}
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      gap: spacing.xs,
   },
   planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
   },
   line: {
      marginTop: spacing.xs,
   },
   featureList: {
      marginTop: spacing.md,
      gap: spacing.sm,
   },
   featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
   },
});
