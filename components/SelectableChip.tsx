import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface SelectableChipProps {
   label: string;
   selected: boolean;
   disabled?: boolean;
   onPress: () => void;
   testID?: string;
   /** Removes outer margins — use in flex-wrap layouts with gap */
   compact?: boolean;
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
   compact = false,
}) => {
   return (
      <TouchableOpacity
         style={[
            styles.chip,
            compact && styles.chipCompact,
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
         <Text style={styles.chipText}>{label}</Text>
      </TouchableOpacity>
   );
};

const styles = StyleSheet.create({
   chip: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: borderRadius.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
   },
   chipCompact: {
      marginRight: 0,
      marginBottom: 0,
   },
   chipSelected: {
      borderColor: colors.accent.primary,
      borderWidth: 1.5,
   },
   chipDisabled: {
      opacity: 0.4,
   },
   chipText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.primary,
      fontWeight: '500',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
});
