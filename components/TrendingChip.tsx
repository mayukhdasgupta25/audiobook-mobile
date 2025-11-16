import React from 'react';
import {
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface TrendingChipProps {
   label: string;
   onPress: () => void;
}

/**
 * Trending search chip component
 * Displays a pill-shaped button for trending search terms
 */
export const TrendingChip: React.FC<TrendingChipProps> = ({ label, onPress }) => {
   return (
      <TouchableOpacity
         style={styles.chip}
         onPress={onPress}
         activeOpacity={0.7}
         accessibilityRole="button"
         accessibilityLabel={`Search for ${label}`}
         accessibilityHint="Tap to search"
      >
         <Text style={styles.chipText}>{label}</Text>
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
   },
   chipText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.dark,
      fontWeight: '500',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
});

