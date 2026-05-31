import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { borderRadius, spacing } from '@/theme';

export function SkeletonPublisherHeader() {
   return (
      <View style={styles.container}>
         <SkeletonBox shape="square" size={120} borderRadius={borderRadius.xl} />
         <SkeletonText width="60%" height={20} style={styles.line} />
         <SkeletonText width="90%" height={14} style={styles.line} />
         <SkeletonText width="75%" height={14} style={styles.line} />
         <SkeletonText width="40%" height={18} style={styles.sectionLabel} />
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      alignItems: 'center',
      paddingBottom: spacing.lg,
      width: '100%',
   },
   line: {
      marginTop: spacing.sm,
   },
   sectionLabel: {
      alignSelf: 'stretch',
      marginTop: spacing.lg,
   },
});
