import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface SettingsMenuRowProps {
   title: string;
   subtitle: string;
   icon: keyof typeof Ionicons.glyphMap;
   iconBg: string;
   iconColor: string;
   onPress?: () => void;
   trailing?: React.ReactNode;
   showChevron?: boolean;
   isLast?: boolean;
}

export const SettingsMenuRow: React.FC<SettingsMenuRowProps> = ({
   title,
   subtitle,
   icon,
   iconBg,
   iconColor,
   onPress,
   trailing,
   showChevron = true,
   isLast = false,
}) => {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         row: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            minHeight: 72,
         },
         iconCircle: {
            width: 40,
            height: 40,
            borderRadius: borderRadius.full,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
         },
         content: {
            flex: 1,
            marginRight: spacing.sm,
         },
         title: {
            fontSize: typography.fontSize.base,
            color: t.colors.text.primary,
            marginBottom: 2,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         subtitle: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
         },
         divider: {
            height: 1,
            backgroundColor: t.colors.border.light,
            marginLeft: spacing.md + 40 + spacing.md,
         },
      })
   );

   const content = (
      <>
         <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
         </View>
         <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
         </View>
         {trailing ?? (
            showChevron ? (
               <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.secondaryDark}
               />
            ) : null
         )}
      </>
   );

   return (
      <>
         {onPress ? (
            <TouchableOpacity
               style={styles.row}
               onPress={onPress}
               activeOpacity={0.7}
            >
               {content}
            </TouchableOpacity>
         ) : (
            <View style={styles.row}>{content}</View>
         )}
         {!isLast ? <View style={styles.divider} /> : null}
      </>
   );
};
