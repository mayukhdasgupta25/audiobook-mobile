import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { spacing, typography, borderRadius } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { RootState } from '@/store';
import {
   setSkipDurationSeconds,
   type SkipDurationSeconds,
} from '@/store/settings';

const SKIP_DURATION_OPTIONS: SkipDurationSeconds[] = [5, 10, 15];

interface SkipDurationPickerProps {
   hint?: string;
}

export const SkipDurationPicker: React.FC<SkipDurationPickerProps> = ({
   hint = 'Skip forward and backward duration for in-app and lock screen controls.',
}) => {
   const dispatch = useDispatch();
   const skipDurationSeconds = useSelector(
      (state: RootState) => state.settings.skipDurationSeconds
   );

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         content: {
            padding: spacing.md,
         },
         hint: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginBottom: spacing.md,
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
         },
         row: {
            flexDirection: 'row',
            gap: spacing.sm,
         },
         option: {
            flex: 1,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.sm,
            borderRadius: borderRadius.lg,
            borderWidth: 2,
            borderColor: t.colors.border.medium,
            backgroundColor: 'transparent',
            alignItems: 'center',
         },
         optionSelected: {
            borderColor: t.colors.accent.primary,
            backgroundColor: t.colors.background.highlight,
         },
         optionText: {
            fontSize: typography.fontSize.base,
            color: t.colors.text.secondary,
            fontWeight: '600',
         },
         optionTextSelected: {
            color: t.colors.accent.primary,
         },
      })
   );

   return (
      <View style={styles.content}>
         <Text style={styles.hint}>{hint}</Text>
         <View style={styles.row}>
            {SKIP_DURATION_OPTIONS.map((seconds) => {
               const isSelected = skipDurationSeconds === seconds;
               return (
                  <TouchableOpacity
                     key={seconds}
                     style={[styles.option, isSelected && styles.optionSelected]}
                     onPress={() => dispatch(setSkipDurationSeconds(seconds))}
                     activeOpacity={0.7}
                  >
                     <Text
                        style={[
                           styles.optionText,
                           isSelected && styles.optionTextSelected,
                        ]}
                     >
                        {seconds}s
                     </Text>
                  </TouchableOpacity>
               );
            })}
         </View>
      </View>
   );
};
