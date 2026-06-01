import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { spacing, typography } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface LibraryEmptyStateProps {
   title: string;
   hint: string;
}

export function LibraryEmptyState({ title, hint }: LibraryEmptyStateProps) {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flex: 1,
            padding: spacing.xxl,
            alignItems: 'center',
            justifyContent: 'center',
         },
         title: {
            fontSize: typography.fontSize.lg,
            color: t.colors.text.primary,
            textAlign: 'center',
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '600' },
            }),
         },
         hint: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginTop: spacing.sm,
            textAlign: 'center',
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
         },
      })
   );

   return (
      <View style={styles.container}>
         <Text style={styles.title}>{title}</Text>
         <Text style={styles.hint}>{hint}</Text>
      </View>
   );
}
