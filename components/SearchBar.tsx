import React, { useEffect, useRef } from 'react';
import {
   View,
   TextInput,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface SearchBarProps {
   value: string;
   onChangeText: (text: string) => void;
   onClear: () => void;
   onSubmit?: () => void;
   placeholder?: string;
   autoFocus?: boolean;
}

/**
 * Search bar component with search icon and clear button
 * Automatically focuses on mount if autoFocus is true
 */
export const SearchBar: React.FC<SearchBarProps> = ({
   value,
   onChangeText,
   onClear,
   onSubmit,
   placeholder = 'Search stories, authors, genres...',
   autoFocus = false,
}) => {
   const inputRef = useRef<TextInput>(null);

   useEffect(() => {
      if (autoFocus) {
         // Slight delay for smoother animation
         const timer = setTimeout(() => {
            inputRef.current?.focus();
         }, 100);
         return () => clearTimeout(timer);
      }
      return undefined;
   }, [autoFocus]);

   return (
      <View style={styles.container}>
         {/* Search Icon */}
         <Ionicons
            name="search"
            size={20}
            color={colors.text.secondaryDark}
            style={styles.searchIcon}
         />

         {/* Text Input */}
         <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.text.secondaryDark}
            keyboardAppearance="dark"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            onSubmitEditing={onSubmit}
            accessibilityRole="search"
            accessibilityLabel="Search input"
         />

         {/* Clear Button */}
         {value.length > 0 && (
            <TouchableOpacity
               onPress={onClear}
               style={styles.clearButton}
               activeOpacity={0.7}
               accessibilityLabel="Clear search"
               accessibilityRole="button"
            >
               <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.text.secondaryDark}
               />
            </TouchableOpacity>
         )}
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      height: 48,
      flex: 1,
   },
   searchIcon: {
      marginRight: spacing.sm,
   },
   input: {
      flex: 1,
      fontSize: typography.fontSize.lg,
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   clearButton: {
      marginLeft: spacing.sm,
      padding: spacing.xs,
   },
});

