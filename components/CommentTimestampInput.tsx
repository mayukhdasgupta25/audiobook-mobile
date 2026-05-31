import React from 'react';
import { TextInput, StyleSheet, Platform } from 'react-native';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

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
   const { colors, isDark } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         input: {
            flex: 1,
            minHeight: 48,
            fontSize: typography.fontSize.base,
            lineHeight: 22,
            color: t.colors.text.primary,
            backgroundColor: 'transparent',
            paddingHorizontal: spacing.md,
            paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
         },
         androidInput: {
            includeFontPadding: false,
            textAlignVertical: 'center',
         },
      })
   );

   return (
      <TextInput
         style={[styles.input, Platform.OS === 'android' && styles.androidInput]}
         value={value}
         onChangeText={onChangeText}
         placeholder={placeholder}
         placeholderTextColor={colors.text.muted}
         editable={editable}
         keyboardAppearance={isDark ? 'dark' : 'light'}
         selectionColor={colors.accent.primary}
         cursorColor={colors.accent.primary}
         underlineColorAndroid="transparent"
      />
   );
};
