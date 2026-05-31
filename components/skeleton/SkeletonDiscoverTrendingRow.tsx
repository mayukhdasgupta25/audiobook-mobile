import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

interface SkeletonDiscoverTrendingRowProps {
   count?: number;
}

export function SkeletonDiscoverTrendingRow({ count = 5 }: SkeletonDiscoverTrendingRowProps) {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
         },
         info: {
            flex: 1,
            marginHorizontal: spacing.md,
         },
         subtitle: {
            marginTop: 2,
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
                  <SkeletonBox shape="square" size={48} borderRadius={borderRadius.md} />
                  <View style={styles.info}>
                     <SkeletonText width="80%" height={14} />
                     <SkeletonText width="55%" height={12} style={styles.subtitle} />
                  </View>
                  <SkeletonBox shape="circle" size={36} />
               </View>
               <View style={styles.divider} />
            </View>
         ))}
      </>
   );
}
