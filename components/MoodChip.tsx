import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface MoodChipProps {
   label: string;
   icon?: keyof typeof Ionicons.glyphMap;
   onPress?: () => void;
}

export const MoodChip: React.FC<MoodChipProps> = ({ label, icon, onPress }) => (
   <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.7}
   >
      {icon && (
         <Ionicons
            name={icon}
            size={16}
            color={colors.accent.primary}
            style={styles.icon}
         />
      )}
      <Text style={styles.label}>{label}</Text>
   </TouchableOpacity>
);

const styles = StyleSheet.create({
   chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: colors.background.screen,
      marginRight: spacing.sm,
   },
   icon: {
      marginRight: spacing.xs,
   },
   label: {
      fontSize: typography.fontSize.sm,
      color: colors.text.primary,
      fontWeight: '500',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
});
