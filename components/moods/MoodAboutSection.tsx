import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MoodSvgIcon } from '@/components/moods/MoodSvgIcon';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { hexToRgba, normalizeHexCode, resolveMoodDisplayColor } from '@/utils/moodAssets';

interface MoodAboutSectionProps {
   moodName: string;
   purpose: string;
   moodColor: string;
}

export const MoodAboutSection: React.FC<MoodAboutSectionProps> = ({
   moodName,
   purpose,
   moodColor,
}) => {
   const { colors, isDark } = useTheme();
   const rawColor = normalizeHexCode(moodColor);
   const color = useMemo(
      () =>
         resolveMoodDisplayColor(rawColor, {
            isDark,
            moodName,
            fallbackAccent: colors.accent.primary,
         }),
      [rawColor, isDark, moodName, colors.accent.primary]
   );

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         section: {
            marginTop: 'auto' as const,
            marginBottom: 0,
            paddingHorizontal: spacing.md,
         },
         sectionTitle: {
            fontSize: typography.fontSize.lg,
            color: t.colors.text.primary,
            marginBottom: spacing.sm,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         card: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
         },
         iconCircle: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.full,
            backgroundColor: t.colors.background.highlight,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
         },
         description: {
            flex: 1,
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '400' },
               android: { fontFamily: 'sans-serif' },
            }),
         },
      })
   );

   if (!purpose) {
      return null;
   }

   return (
      <View style={styles.section}>
         <Text style={styles.sectionTitle}>About this mood</Text>
         <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: hexToRgba(color, 0.18) }]}>
               <MoodSvgIcon source="description" name={moodName} color={color} size={28} />
            </View>
            <Text style={styles.description}>{purpose}</Text>
         </View>
      </View>
   );
};
