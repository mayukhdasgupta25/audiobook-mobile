import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface StatItem {
   key: string;
   label: string;
   icon: keyof typeof Ionicons.glyphMap;
   iconBg: string;
   iconColor: string;
}

const STAT_ITEMS: StatItem[] = [
   {
      key: 'titles',
      label: 'Titles Listened',
      icon: 'book-outline',
      iconBg: colors.iconBackgrounds.orange,
      iconColor: colors.iconForegrounds.brown,
   },
   {
      key: 'hours',
      label: 'Hours Listened',
      icon: 'time-outline',
      iconBg: colors.iconBackgrounds.green,
      iconColor: colors.iconForegrounds.green,
   },
   {
      key: 'favorites',
      label: 'Favorites',
      icon: 'heart-outline',
      iconBg: colors.iconBackgrounds.pink,
      iconColor: colors.iconForegrounds.pink,
   },
   {
      key: 'downloads',
      label: 'Downloads',
      icon: 'download-outline',
      iconBg: colors.iconBackgrounds.blue,
      iconColor: colors.iconForegrounds.blue,
   },
];

/**
 * Stats row shell — labels and icons only until a stats API exists.
 */
export const ProfileStatsRow: React.FC = () => {
   return (
      <View style={styles.container}>
         {STAT_ITEMS.map((item) => (
            <View key={item.key} style={styles.statItem}>
               <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
               </View>
               <Text style={styles.label}>{item.label}</Text>
            </View>
         ))}
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.background.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.lg,
   },
   statItem: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
   },
   iconCircle: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
   },
   label: {
      fontSize: typography.fontSize.xs,
      color: colors.text.secondary,
      textAlign: 'center',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '400' },
         android: { fontFamily: 'sans-serif' },
      }),
   },
});
