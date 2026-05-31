import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import { MoodSvgIcon } from '@/components/moods/MoodSvgIcon';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
   hexToRgba,
   isLowContrastMoodColor,
   normalizeHexCode,
   normalizeMoodKey,
   resolveMoodDisplayColor,
   resolveMoodTintBackground,
} from '@/utils/moodAssets';
import type { Mood } from '@/services/moods';

type MoodChipVariant = 'pill' | 'card';

interface MoodChipProps {
   mood: Mood;
   onPress?: () => void;
   variant?: MoodChipVariant;
}

export const MoodChip: React.FC<MoodChipProps> = ({
   mood,
   onPress,
   variant = 'pill',
}) => {
   const { colors, isDark } = useTheme();
   const isCard = variant === 'card';
   const rawColor = normalizeHexCode(mood.hexCode);

   const displayColor = useMemo(
      () =>
         resolveMoodDisplayColor(rawColor, {
            isDark,
            moodName: mood.name,
            fallbackAccent: colors.accent.primary,
         }),
      [rawColor, isDark, mood.name, colors.accent.primary]
   );

   const needsLowContrastTreatment =
      isDark &&
      (normalizeMoodKey(mood.name) === 'dark' || isLowContrastMoodColor(rawColor, true));

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         chip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            marginRight: spacing.sm,
         },
         card: {
            width: 76,
            alignItems: 'center',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.xs,
            borderRadius: borderRadius.lg,
            backgroundColor: t.colors.background.card,
            marginRight: spacing.sm,
         },
         cardLowContrast: {
            borderWidth: 1,
            borderColor: t.colors.border.light,
         },
         iconWrap: {
            marginRight: spacing.xs,
         },
         cardIconWrap: {
            width: 44,
            height: 44,
            borderRadius: borderRadius.md,
            backgroundColor: t.colors.background.highlight,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.xs,
         },
         label: {
            fontSize: typography.fontSize.sm,
            fontWeight: '500',
            color: t.colors.text.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '500' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         cardLabel: {
            fontSize: typography.fontSize.xs,
            color: t.colors.text.primary,
            textAlign: 'center',
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '500' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
      })
   );

   const pillBackground = resolveMoodTintBackground(rawColor, {
      isDark,
      moodName: mood.name,
      variant: 'pill',
      fallbackAccent: colors.accent.primary,
   });

   const iconWellBackground = needsLowContrastTreatment
      ? hexToRgba(displayColor, 0.22)
      : resolveMoodTintBackground(rawColor, {
           isDark,
           moodName: mood.name,
           variant: 'card',
           fallbackAccent: colors.accent.primary,
        });

   return (
      <TouchableOpacity
         style={[
            isCard ? styles.card : styles.chip,
            isCard && needsLowContrastTreatment && styles.cardLowContrast,
            !isCard && { backgroundColor: pillBackground },
         ]}
         onPress={onPress}
         activeOpacity={0.7}
      >
         <View
            style={[
               isCard ? styles.cardIconWrap : styles.iconWrap,
               isCard && { backgroundColor: iconWellBackground },
            ]}
         >
            <MoodSvgIcon
               source="mood"
               name={mood.name}
               color={displayColor}
               size={isCard ? 24 : 16}
            />
         </View>
         <Text
            style={[isCard ? styles.cardLabel : styles.label]}
            numberOfLines={1}
         >
            {mood.name}
         </Text>
      </TouchableOpacity>
   );
};
