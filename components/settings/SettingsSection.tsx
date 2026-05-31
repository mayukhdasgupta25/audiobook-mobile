import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { spacing, typography } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface SettingsSectionProps {
   title: string;
   children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         section: {
            marginBottom: spacing.lg,
         },
         title: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         card: {
            backgroundColor: t.colors.background.card,
            marginHorizontal: spacing.md,
            borderRadius: spacing.md,
            overflow: 'hidden',
         },
      })
   );

   return (
      <View style={styles.section}>
         <Text style={styles.title}>{title}</Text>
         <View style={styles.card}>{children}</View>
      </View>
   );
};
