import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoodSvgIcon } from '@/components/moods/MoodSvgIcon';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
   getMoodGradientAlpha,
   hexToRgba,
   normalizeHexCode,
   resolveMoodDisplayColor,
} from '@/utils/moodAssets';
import type { MoodDetail } from '@/services/moods';

const BACK_BUTTON_SIZE = 40;

interface MoodHeroCardProps {
   mood: MoodDetail;
   /** Safe-area top inset — when set, the card extends edge-to-edge behind the back button */
   topInset?: number;
}

export const MoodHeroCard: React.FC<MoodHeroCardProps> = ({ mood, topInset = 0 }) => {
   const { colors, isDark } = useTheme();
   const rawColor = normalizeHexCode(mood.hexCode);
   const moodColor = useMemo(
      () =>
         resolveMoodDisplayColor(rawColor, {
            isDark,
            moodName: mood.name,
            fallbackAccent: colors.accent.primary,
         }),
      [rawColor, isDark, mood.name, colors.accent.primary]
   );

   const extendsBehindHeader = topInset > 0;

   const headerClearance = extendsBehindHeader
      ? topInset + BACK_BUTTON_SIZE + spacing.md + spacing.sm
      : spacing.lg;

   const gradientColors = useMemo(() => {
      if (extendsBehindHeader) {
         return [
            hexToRgba(moodColor, getMoodGradientAlpha(0.04, isDark, rawColor)),
            hexToRgba(moodColor, getMoodGradientAlpha(0.1, isDark, rawColor)),
            hexToRgba(moodColor, getMoodGradientAlpha(0.22, isDark, rawColor)),
         ] as const;
      }

      return [
         hexToRgba(moodColor, getMoodGradientAlpha(0.06, isDark, rawColor)),
         hexToRgba(moodColor, getMoodGradientAlpha(0.22, isDark, rawColor)),
      ] as const;
   }, [extendsBehindHeader, moodColor, isDark, rawColor]);

   const gradientLocations = extendsBehindHeader ? ([0, 0.45, 1] as const) : undefined;

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            marginHorizontal: spacing.md,
            marginBottom: spacing.lg,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            paddingTop: spacing.lg,
            overflow: 'hidden',
         },
         containerExtended: {
            marginHorizontal: 0,
            marginBottom: spacing.lg,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: borderRadius.xl,
            borderBottomRightRadius: borderRadius.xl,
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.lg,
         },
         content: {
            flexDirection: 'row',
            alignItems: 'flex-start',
         },
         contentExtended: {
            paddingHorizontal: spacing.xs,
         },
         iconWrap: {
            marginRight: spacing.md,
            paddingTop: spacing.xs,
         },
         textBlock: {
            flex: 1,
         },
         title: {
            fontSize: typography.fontSize['3xl'],
            marginBottom: spacing.sm,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         description: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
            marginBottom: spacing.md,
         },
         pillsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
         },
         pill: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            backgroundColor: t.colors.background.card,
            gap: spacing.xs,
         },
         pillText: {
            fontSize: typography.fontSize.xs,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '500' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
      })
   );

   return (
      <LinearGradient
         colors={gradientColors}
         locations={gradientLocations}
         start={{ x: 0.5, y: 0 }}
         end={{ x: 0.5, y: 1 }}
         style={[
            styles.container,
            extendsBehindHeader && styles.containerExtended,
            { paddingTop: headerClearance },
         ]}
      >
         <View style={[styles.content, extendsBehindHeader && styles.contentExtended]}>
            <View style={styles.iconWrap}>
               <MoodSvgIcon source="mood" name={mood.name} color={moodColor} size={72} />
            </View>

            <View style={styles.textBlock}>
               <Text style={[styles.title, { color: moodColor }]}>{mood.name}</Text>
               {mood.description ? (
                  <Text style={styles.description}>{mood.description}</Text>
               ) : null}

               {mood.moodAttributes.length > 0 ? (
                  <View style={styles.pillsRow}>
                     {mood.moodAttributes.map((attribute, index) => (
                        <View
                           key={`${attribute.iconName}-${index}`}
                           style={styles.pill}
                        >
                           <MoodSvgIcon
                              source="attribute"
                              name={attribute.iconName}
                              color={moodColor}
                              size={14}
                           />
                           <Text style={[styles.pillText, { color: moodColor }]}>
                              {attribute.iconName}
                           </Text>
                        </View>
                     ))}
                  </View>
               ) : null}
            </View>
         </View>
      </LinearGradient>
   );
};
