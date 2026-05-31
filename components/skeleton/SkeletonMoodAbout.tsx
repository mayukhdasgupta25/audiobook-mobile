import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

export function SkeletonMoodAbout() {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         section: {
            marginTop: spacing.lg,
            paddingHorizontal: spacing.md,
         },
         title: {
            marginBottom: spacing.sm,
         },
         card: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
         },
         textBlock: {
            flex: 1,
            marginLeft: spacing.md,
         },
         line: {
            marginTop: spacing.sm,
         },
      })
   );

   return (
      <View style={styles.section}>
         <SkeletonText width={160} height={18} style={styles.title} />
         <View style={styles.card}>
            <SkeletonBox shape="circle" size={48} />
            <View style={styles.textBlock}>
               <SkeletonText width="100%" height={12} />
               <SkeletonText width="95%" height={12} style={styles.line} />
               <SkeletonText width="88%" height={12} style={styles.line} />
            </View>
         </View>
      </View>
   );
}
