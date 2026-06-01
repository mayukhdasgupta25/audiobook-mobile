import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface LibraryListCardProps {
   children: React.ReactNode;
}

/** Card container for library list screens — matches Settings section cards. */
export function LibraryListCard({ children }: LibraryListCardProps) {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         card: {
            backgroundColor: t.colors.background.card,
            marginHorizontal: spacing.md,
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
         },
         divider: {
            height: 1,
            backgroundColor: t.colors.border.light,
            marginLeft: spacing.md + 56 + spacing.md,
         },
      })
   );

   const childArray = React.Children.toArray(children);

   return (
      <View style={styles.card}>
         {childArray.map((child, index) => (
            <React.Fragment key={index}>
               {index > 0 ? <View style={styles.divider} /> : null}
               {child}
            </React.Fragment>
         ))}
      </View>
   );
}
