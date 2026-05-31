import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface SettingsSectionProps {
   title: string;
   children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
   return (
      <View style={styles.section}>
         <Text style={styles.title}>{title}</Text>
         <View style={styles.card}>{children}</View>
      </View>
   );
};

const styles = StyleSheet.create({
   section: {
      marginBottom: spacing.lg,
   },
   title: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
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
      backgroundColor: colors.background.card,
      marginHorizontal: spacing.md,
      borderRadius: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: 'hidden',
   },
});
