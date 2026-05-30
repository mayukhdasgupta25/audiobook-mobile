import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { TimestampSuggestion } from '@/utils/commentTimestamp';

interface TimestampNumericSuggestionsProps {
   suggestions: TimestampSuggestion[];
   onSelect: (suffixDigit: number) => void;
}

export const TimestampNumericSuggestions: React.FC<TimestampNumericSuggestionsProps> = ({
   suggestions,
   onSelect,
}) => {
   if (suggestions.length === 0) return null;

   return (
      <View style={styles.container}>
         <Text style={styles.title}>Choose a time</Text>
         <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.row}
         >
            {suggestions.map((item) => {
               const suffixDigit = parseInt(item.displayLabel.slice(-1), 10);
               return (
                  <TouchableOpacity
                     key={item.displayLabel}
                     style={styles.chip}
                     onPress={() => onSelect(suffixDigit)}
                     activeOpacity={0.85}
                  >
                     <Text style={styles.chipText}>{item.displayLabel}</Text>
                     <Text style={styles.chipSub}>@{item.insertLabel}</Text>
                  </TouchableOpacity>
               );
            })}
         </ScrollView>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: colors.background.highlight,
      ...Platform.select({
         android: { elevation: 3 },
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 3,
         },
      }),
   },
   title: {
      fontSize: typography.fontSize.xs,
      fontWeight: '600',
      color: colors.text.secondary,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
   },
   row: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
   },
   chip: {
      minWidth: 52,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.accent.primary,
      borderWidth: 1,
      borderColor: colors.accent.primaryDark,
      alignItems: 'center',
   },
   chipText: {
      fontSize: typography.fontSize.lg,
      fontWeight: '700',
      color: '#FFFFFF',
   },
   chipSub: {
      fontSize: typography.fontSize.xs,
      color: colors.primary[100],
      marginTop: 2,
   },
});
