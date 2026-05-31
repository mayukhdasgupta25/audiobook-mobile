import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import { MoodSvgIcon } from '@/components/moods/MoodSvgIcon';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { hexToRgba, normalizeHexCode } from '@/utils/moodAssets';
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
   const moodColor = normalizeHexCode(mood.hexCode);
   const isCard = variant === 'card';

   return (
      <TouchableOpacity
         style={[
            isCard ? styles.card : styles.chip,
            !isCard && {
               borderColor: hexToRgba(moodColor, 0.35),
               backgroundColor: hexToRgba(moodColor, 0.08),
            },
         ]}
         onPress={onPress}
         activeOpacity={0.7}
      >
         <View style={isCard ? styles.cardIconWrap : styles.iconWrap}>
            <MoodSvgIcon
               source="mood"
               name={mood.name}
               color={moodColor}
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

const styles = StyleSheet.create({
   chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      marginRight: spacing.sm,
   },
   card: {
      width: 76,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.background.screen,
      marginRight: spacing.sm,
   },
   iconWrap: {
      marginRight: spacing.xs,
   },
   cardIconWrap: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.screen,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
   },
   label: {
      fontSize: typography.fontSize.sm,
      fontWeight: '500',
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   cardLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.text.primary,
      textAlign: 'center',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
});
