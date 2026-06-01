import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, type ThemeColors } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useProfileStats, type ProfileStatsValues } from '@/hooks/useProfileStats';

interface StatItem {
   key: keyof ProfileStatsValues;
   label: string;
   icon: keyof typeof Ionicons.glyphMap;
   iconBg: string;
   iconColor: string;
}

function getStatItems(colors: ThemeColors): StatItem[] {
   return [
      {
         key: 'titlesListened',
         label: 'Titles Listened',
         icon: 'book-outline',
         iconBg: colors.iconBackgrounds.orange,
         iconColor: colors.iconForegrounds.brown,
      },
      {
         key: 'hoursListened',
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
}

export const ProfileStatsRow: React.FC = () => {
   const { colors } = useTheme();
   const { stats } = useProfileStats();
   const statItems = useMemo(() => getStatItems(colors), [colors]);

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: t.colors.background.card,
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
         value: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.primary,
            textAlign: 'center',
            marginBottom: 2,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         label: {
            fontSize: typography.fontSize.xs,
            color: t.colors.text.secondary,
            textAlign: 'center',
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '400' },
               android: { fontFamily: 'sans-serif' },
            }),
         },
      })
   );

   return (
      <View style={styles.container}>
         {statItems.map((item) => (
            <View key={item.key} style={styles.statItem}>
               <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
               </View>
               <Text style={styles.value} numberOfLines={1}>
                  {stats[item.key]}
               </Text>
               <Text style={styles.label}>{item.label}</Text>
            </View>
         ))}
      </View>
   );
};
