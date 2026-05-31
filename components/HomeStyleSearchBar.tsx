import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface HomeStyleSearchBarProps {
   value: string;
   onChangeText: (text: string) => void;
   placeholder?: string;
}

/**
 * Search bar matching the Home screen style (functional TextInput).
 */
export const HomeStyleSearchBar: React.FC<HomeStyleSearchBarProps> = ({
   value,
   onChangeText,
   placeholder = 'Search stories, authors, genres...',
}) => {
   const { colors, isDark } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         searchBar: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.colors.background.input,
            borderRadius: borderRadius.lg,
            marginHorizontal: spacing.md,
            marginBottom: spacing.md,
            paddingHorizontal: spacing.md,
            height: 48,
            gap: spacing.sm,
         },
         input: {
            flex: 1,
            fontSize: typography.fontSize.base,
            color: t.colors.text.primary,
            paddingVertical: 0,
         },
      })
   );

   return (
      <View style={styles.searchBar}>
         <Ionicons name="search" size={20} color={colors.text.muted} />
         <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.text.muted}
            value={value}
            onChangeText={onChangeText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            keyboardAppearance={isDark ? 'dark' : 'light'}
         />
      </View>
   );
};
