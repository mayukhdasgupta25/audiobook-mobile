import React from 'react';
import { TextInput, StyleSheet, Platform } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface CommentTimestampInputProps {
   value: string;
   onChangeText: (text: string) => void;
   placeholder?: string;
   editable?: boolean;
}

/** Comment composer input — normal visible text; @ highlights appear in posted comments */
export const CommentTimestampInput: React.FC<CommentTimestampInputProps> = ({
   value,
   onChangeText,
   placeholder = 'Share your thoughts...',
   editable = true,
}) => {
   return (
      <TextInput
         style={[styles.input, Platform.OS === 'android' && styles.androidInput]}
         value={value}
         onChangeText={onChangeText}
         placeholder={placeholder}
         placeholderTextColor={colors.text.muted}
         editable={editable}
         keyboardAppearance="light"
         selectionColor={colors.accent.primary}
         cursorColor={colors.accent.primary}
         underlineColorAndroid="transparent"
      />
   );
};

const styles = StyleSheet.create({
   input: {
      flex: 1,
      minHeight: 48,
      fontSize: typography.fontSize.base,
      lineHeight: 22,
      color: colors.text.primary,
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
   },
   androidInput: {
      includeFontPadding: false,
      textAlignVertical: 'center',
   },
});
