import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

export function SkeletonContinueListeningCard() {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         card: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.xl,
            padding: spacing.md,
            marginHorizontal: spacing.md,
            ...t.shadows.sm,
         },
         content: {
            flex: 1,
            marginLeft: spacing.md,
            marginRight: spacing.sm,
         },
         line: {
            marginTop: 2,
            marginBottom: spacing.sm,
         },
         progress: {
            marginBottom: spacing.xs,
         },
         metaRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.sm,
         },
      })
   );

   return (
      <View style={styles.card}>
         <SkeletonBox width={64} height={64} borderRadius={borderRadius.md} />
         <View style={styles.content}>
            <SkeletonText width="75%" height={14} />
            <SkeletonText width="50%" height={12} style={styles.line} />
            <SkeletonBox width="100%" height={4} borderRadius={2} style={styles.progress} />
            <View style={styles.metaRow}>
               <SkeletonText width="55%" height={10} />
               <SkeletonText width="30%" height={10} />
            </View>
         </View>
         <SkeletonBox shape="circle" size={44} />
      </View>
   );
}
