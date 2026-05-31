import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { spacing } from '@/theme';

interface SkeletonPlaylistPickRowProps {
   count?: number;
}

/** Matches AddToPlaylistSheet list row (icon + title + trailing action). */
export function SkeletonPlaylistPickRow({ count = 4 }: SkeletonPlaylistPickRowProps) {
   return (
      <>
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.row}>
               <SkeletonBox shape="square" size={22} borderRadius={4} />
               <SkeletonText width="65%" height={14} style={styles.title} />
               <SkeletonBox shape="circle" size={22} />
            </View>
         ))}
      </>
   );
}

const styles = StyleSheet.create({
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
   },
   title: {
      flex: 1,
      marginHorizontal: spacing.md,
   },
});
