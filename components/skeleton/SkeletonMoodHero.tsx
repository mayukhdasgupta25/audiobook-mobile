import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

export function SkeletonMoodHero() {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            marginHorizontal: spacing.md,
            borderRadius: borderRadius.lg,
            backgroundColor: t.colors.background.highlight,
            padding: spacing.lg,
         },
         content: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.md,
         },
         textBlock: {
            flex: 1,
            minWidth: 0,
         },
         line: {
            marginTop: spacing.sm,
         },
         pillsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginTop: spacing.md,
         },
      })
   );

   return (
      <View style={styles.container}>
         <View style={styles.content}>
            <SkeletonBox shape="square" size={72} borderRadius={borderRadius.md} />
            <View style={styles.textBlock}>
               <SkeletonText width="55%" height={24} />
               <SkeletonText width="90%" height={14} style={styles.line} />
               <SkeletonText width="75%" height={14} style={styles.line} />
               <View style={styles.pillsRow}>
                  <SkeletonBox width={88} height={28} borderRadius={borderRadius.full} />
                  <SkeletonBox width={72} height={28} borderRadius={borderRadius.full} />
               </View>
            </View>
         </View>
      </View>
   );
}
