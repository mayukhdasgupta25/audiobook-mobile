import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

interface LibrarySectionHeaderProps {
   title: string;
   onSeeAll: () => void;
   onAdd?: () => void;
}

export const LibrarySectionHeader: React.FC<LibrarySectionHeaderProps> = ({
   title,
   onSeeAll,
   onAdd,
}) => {
   return (
      <View style={styles.row}>
         <Text style={styles.title}>{title}</Text>
         <View style={styles.actions}>
            {onAdd && (
               <TouchableOpacity
                  onPress={onAdd}
                  style={styles.iconButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
               >
                  <Ionicons name="add" size={22} color={colors.accent.primary} />
               </TouchableOpacity>
            )}
            <TouchableOpacity
               onPress={onSeeAll}
               style={styles.iconButton}
               hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
               activeOpacity={0.7}
               accessibilityLabel={`See all ${title}`}
            >
               <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={colors.text.secondary}
               />
            </TouchableOpacity>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      ...Platform.select({
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
   },
   iconButton: {
      padding: spacing.xs,
   },
});
