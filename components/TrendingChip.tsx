import React from 'react';
import {
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { spacing, typography, borderRadius } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface TrendingChipProps {
   label: string;
   onPress: () => void;
}

/**
 * Trending search chip component
 * Displays a pill-shaped button for trending search terms
 */
export const TrendingChip: React.FC<TrendingChipProps> = ({ label, onPress }) => {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         chip: {
            backgroundColor: t.colors.background.input,
            borderRadius: borderRadius.full,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            marginRight: spacing.sm,
         },
         chipText: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.dark,
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
      })
   );

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
