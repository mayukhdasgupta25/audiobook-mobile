import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MoodSvgIcon } from '@/components/moods/MoodSvgIcon';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { normalizeHexCode } from '@/utils/moodAssets';

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
   const color = normalizeHexCode(moodColor);

   if (!purpose) {
      return null;
   }

   return (
      <View style={styles.section}>
         <Text style={styles.sectionTitle}>About this mood</Text>
         <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
               <MoodSvgIcon source="description" name={moodName} color={color} size={28} />
            </View>
            <Text style={styles.description}>{purpose}</Text>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   section: {
      marginTop: 'auto' as const,
      marginBottom: 0,
      paddingHorizontal: spacing.md,
   },
   sectionTitle: {
      fontSize: typography.fontSize.lg,
      color: colors.text.primary,
      marginBottom: spacing.sm,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
      }),
   },
   card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
   },
   iconCircle: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background.screen,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
   },
   description: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '400' },
         android: { fontFamily: 'sans-serif' },
      }),
   },
});
