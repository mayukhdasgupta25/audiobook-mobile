import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PLAYLIST_CARD_WIDTH } from '@/components/PlaylistCard';
import { SkeletonBox } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

interface SkeletonLibraryPlaylistRowProps {
   count?: number;
}

export function SkeletonLibraryPlaylistRow({ count = 8 }: SkeletonLibraryPlaylistRowProps) {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         row: {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
         },
         card: {
            width: PLAYLIST_CARD_WIDTH,
            marginRight: spacing.sm,
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
         },
         line: {
            marginTop: spacing.sm,
         },
      })
   );

   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.row}
      >
         {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.card}>
               <SkeletonBox shape="square" size={48} borderRadius={borderRadius.md} />
               <SkeletonText width={PLAYLIST_CARD_WIDTH - 32} height={14} style={styles.line} />
               <SkeletonText width="70%" height={12} style={styles.line} />
            </View>
         ))}
      </ScrollView>
   );
}
