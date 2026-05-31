import React from 'react';
import {
   View,
   TextInput,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { getTabBarFloatBottom, getTabBarFloatHorizontal } from '@/theme/tabLayout';
import { CommentTimestampInput } from './CommentTimestampInput';

interface CommentInputBarProps {
   placeholder?: string;
   disabled?: boolean;
   value?: string;
   onChangeText?: (text: string) => void;
   onSend?: () => void;
   /** Pill-style bar floated above the bottom edge with shadow */
   floating?: boolean;
   /** Brown @ highlighting while composing timestamp mentions */
   highlightTimestamps?: boolean;
}

export const CommentInputBar: React.FC<CommentInputBarProps> = ({
   placeholder = 'Share your thoughts...',
   disabled = true,
   value = '',
   onChangeText,
   onSend,
   floating = false,
   highlightTimestamps = false,
}) => {
   const insets = useSafeAreaInsets();

   const inputNode = highlightTimestamps ? (
      <CommentTimestampInput
         value={value}
         onChangeText={onChangeText ?? (() => {})}
         placeholder={placeholder}
         editable={!disabled}
      />
   ) : (
      <TextInput
         style={styles.plainInput}
         placeholder={placeholder}
         placeholderTextColor={colors.text.muted}
         editable={!disabled}
         value={value}
         onChangeText={onChangeText}
         keyboardAppearance="light"
      />
   );

   const row = (
      <View style={styles.row}>
         <View style={highlightTimestamps ? styles.highlightInputWrap : styles.input}>
            {inputNode}
         </View>
         <TouchableOpacity
            style={[styles.sendButton, disabled && styles.sendDisabled]}
            disabled={disabled}
            onPress={onSend}
            activeOpacity={0.7}
         >
            <Ionicons name="send" size={20} color="#FFFFFF" />
         </TouchableOpacity>
      </View>
   );

   if (!floating) {
      return (
         <View style={styles.container}>
            <View style={styles.divider} />
            {row}
         </View>
      );
   }

   return (
      <View
         pointerEvents="box-none"
         style={[
            styles.floatingOuter,
            {
               paddingHorizontal: getTabBarFloatHorizontal(),
               paddingBottom: insets.bottom + getTabBarFloatBottom(),
            },
         ]}
      >
         <View style={styles.floatingPill}>{row}</View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      backgroundColor: colors.background.screen,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
   },
   floatingOuter: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      ...Platform.select({
         android: { elevation: 100 },
      }),
   },
   divider: {
      height: 1,
      backgroundColor: colors.background.highlight,
   },
   floatingPill: {
      borderRadius: borderRadius.xl,
      backgroundColor: colors.background.screen,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      ...shadows.lg,
      ...Platform.select({
         android: { elevation: 12 },
      }),
   },
   row: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   input: {
      flex: 1,
      minHeight: 48,
      backgroundColor: colors.background.input,
      borderRadius: borderRadius.lg,
      marginRight: spacing.sm,
      overflow: 'hidden',
   },
   highlightInputWrap: {
      flex: 1,
      minHeight: 48,
      backgroundColor: colors.background.input,
      borderRadius: borderRadius.lg,
      marginRight: spacing.sm,
      overflow: 'hidden',
   },
   plainInput: {
      flex: 1,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
   },
   sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
   },
   sendDisabled: {
      opacity: 0.4,
   },
});
