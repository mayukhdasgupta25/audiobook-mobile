import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, colors, spacing } from '@/theme';

interface SkeletonNoteCardProps {
   count?: number;
}

export function SkeletonNoteCard({ count = 4 }: SkeletonNoteCardProps) {
   return (
      <>
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.card}>
               <View style={styles.header}>
                  <SkeletonText width="65%" height={14} />
                  <SkeletonBox shape="square" size={18} borderRadius={4} />
               </View>
               <SkeletonText width="30%" height={12} style={styles.timestamp} />
               <SkeletonText width="100%" height={12} style={styles.bodyLine} />
               <SkeletonText width="92%" height={12} style={styles.bodyLine} />
               <SkeletonText width="75%" height={12} style={styles.bodyLine} />
            </View>
         ))}
      </>
   );
}

const styles = StyleSheet.create({
   card: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   timestamp: {
      marginTop: spacing.xs,
   },
   bodyLine: {
      marginTop: spacing.sm,
   },
});
