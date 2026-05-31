import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MoodSvgIcon } from '@/components/moods/MoodSvgIcon';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { normalizeHexCode, toSentenceCase } from '@/utils/moodAssets';
import type { MoodAttribute } from '@/services/moods';

interface MoodBestForCardProps {
   attribute: MoodAttribute;
   moodColor: string;
}

export const MoodBestForCard: React.FC<MoodBestForCardProps> = ({
   attribute,
   moodColor,
}) => {
   const color = normalizeHexCode(moodColor);
   const title = toSentenceCase(attribute.iconName);

   return (
      <View style={styles.card}>
         <View style={styles.iconWrap}>
            <MoodSvgIcon
               source="attribute"
               name={attribute.iconName}
               color={color}
               size={24}
            />
         </View>

         <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description} numberOfLines={2}>
               {attribute.description}
            </Text>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   card: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 260,
      minHeight: 88,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginRight: spacing.md,
      backgroundColor: colors.background.screen,
   },
   iconWrap: {
      marginRight: spacing.md,
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'center',
   },
   textBlock: {
      flex: 1,
      minWidth: 0,
   },
   title: {
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      marginBottom: spacing.xs,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
      }),
   },
   description: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '400' },
         android: { fontFamily: 'sans-serif' },
      }),
   },
});
