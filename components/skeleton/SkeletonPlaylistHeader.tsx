import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, spacing } from '@/theme';

export function SkeletonPlaylistHeader() {
   return (
      <View style={styles.container}>
         <View style={styles.titleRow}>
            <SkeletonText width="70%" height={24} />
            <SkeletonBox shape="square" size={20} borderRadius={4} />
         </View>
         <SkeletonText width="85%" height={14} style={styles.line} />
         <SkeletonBox width="100%" height={48} borderRadius={borderRadius.lg} style={styles.searchBar} />
         <SkeletonText width="45%" height={18} style={styles.sectionLabel} />
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
   },
   titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
   },
   line: {
      marginTop: spacing.sm,
   },
   searchBar: {
      marginTop: spacing.md,
   },
   sectionLabel: {
      marginTop: spacing.lg,
   },
});
