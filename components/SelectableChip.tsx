import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface SelectableChipProps {
   label: string;
   selected: boolean;
   disabled?: boolean;
   onPress: () => void;
   testID?: string;
}

/**
 * Selectable pill chip for onboarding choices (gender, genres)
 */
export const SelectableChip: React.FC<SelectableChipProps> = ({
   label,
   selected,
   disabled = false,
   onPress,
   testID,
}) => {
   return (
      <TouchableOpacity
         style={[
            styles.chip,
            selected && styles.chipSelected,
            disabled && !selected && styles.chipDisabled,
         ]}
         onPress={onPress}
         disabled={disabled}
         activeOpacity={0.7}
         accessibilityRole="button"
         accessibilityState={{ selected, disabled }}
         accessibilityLabel={label}
         testID={testID}
      >
         <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      </TouchableOpacity>
   );
};

const styles = StyleSheet.create({
   chip: {
      backgroundColor: colors.background.darkGrayLight,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
   },
   chipSelected: {
      backgroundColor: colors.app.red,
      borderColor: colors.app.red,
   },
   chipDisabled: {
      opacity: 0.4,
   },
   chipText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.dark,
      fontWeight: '500',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   chipTextSelected: {
      color: colors.text.dark,
      fontWeight: '600',
   },
});
