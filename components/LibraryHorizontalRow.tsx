import React from 'react';
import {
   View,
   Text,
   ScrollView,
   StyleSheet,
   ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface LibraryHorizontalRowProps {
   isLoading?: boolean;
   isEmpty?: boolean;
   emptyMessage?: string;
   children: React.ReactNode;
}

export const LibraryHorizontalRow: React.FC<LibraryHorizontalRowProps> = ({
   isLoading = false,
   isEmpty = false,
   emptyMessage = 'Nothing here yet',
   children,
}) => {
   if (isLoading) {
      return (
         <View style={styles.center}>
            <ActivityIndicator color={colors.accent.primary} />
         </View>
      );
   }

   if (isEmpty) {
      return (
         <View style={styles.center}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
         </View>
      );
   }

   return (
      <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.scrollContent}
      >
         {children}
      </ScrollView>
   );
};

const styles = StyleSheet.create({
   scrollContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
   },
   center: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      minHeight: 100,
      justifyContent: 'center',
      alignItems: 'center',
   },
   emptyText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      textAlign: 'center',
   },
});
