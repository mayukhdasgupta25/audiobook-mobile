import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { formatTimestampForAt } from '@/utils/commentTimestamp';

interface TimestampAtPickerProps {
   positionSeconds: number;
   canUsePlayback: boolean;
   onSelect: (positionSeconds: number) => void;
   onDismiss: () => void;
}

export const TimestampAtPicker: React.FC<TimestampAtPickerProps> = ({
   positionSeconds,
   canUsePlayback,
   onSelect,
   onDismiss,
}) => {
   const formatted = formatTimestampForAt(positionSeconds);

   return (
      <View style={styles.container}>
         <View style={styles.header}>
            <Ionicons name="at" size={18} color={colors.accent.primary} />
            <Text style={styles.headerTitle}>Tag a moment</Text>
            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
               <Ionicons name="close" size={20} color={colors.text.muted} />
            </TouchableOpacity>
         </View>

         {canUsePlayback ? (
            <TouchableOpacity
               style={styles.option}
               onPress={() => onSelect(positionSeconds)}
               activeOpacity={0.85}
            >
               <View style={styles.optionIcon}>
                  <Ionicons name="time" size={20} color={colors.accent.primary} />
               </View>
               <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Current playback time</Text>
                  <Text style={styles.optionSubtitle}>Insert @{formatted}</Text>
               </View>
               <Ionicons name="add-circle" size={24} color={colors.accent.primary} />
            </TouchableOpacity>
         ) : (
            <View style={styles.unavailable}>
               <Ionicons name="information-circle-outline" size={20} color={colors.text.muted} />
               <Text style={styles.unavailableText}>
                  Play this audiobook to tag the current listening time.
               </Text>
            </View>
         )}

         <Text style={styles.hint}>
            Type @ then digits (e.g. @0 → 01–09) or pick current playback time.
         </Text>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.accent.primary,
      backgroundColor: colors.background.highlight,
      ...Platform.select({
         android: { elevation: 4 },
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
         },
      }),
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
   },
   headerTitle: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      fontWeight: '700',
      color: colors.text.primary,
   },
   option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.screen,
      borderWidth: 1,
      borderColor: colors.border.light,
   },
   optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background.input,
      alignItems: 'center',
      justifyContent: 'center',
   },
   optionText: {
      flex: 1,
   },
   optionTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.primary,
   },
   optionSubtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.accent.primary,
      marginTop: 2,
   },
   unavailable: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.sm,
   },
   unavailableText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      lineHeight: 20,
   },
   hint: {
      fontSize: typography.fontSize.xs,
      color: colors.text.muted,
      marginTop: spacing.sm,
   },
});
