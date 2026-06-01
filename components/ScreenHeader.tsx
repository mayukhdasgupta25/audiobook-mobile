import React, { useMemo } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_BACK_ICON, APP_BACK_ICON_SIZE } from '@/constants/navigationIcons';
import {
   resolveScreenHeaderIcon,
   type ScreenHeaderIconKey,
} from '@/constants/screenHeaderIcons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type ScreenHeaderTitleSize = 'large' | 'medium';
type ScreenHeaderTone = 'default' | 'onDark';

interface ScreenHeaderProps {
   /** Resolves icon, default title, and colors from the central registry. */
   headerIcon?: ScreenHeaderIconKey;
   title?: string;
   subtitle?: string;
   onBack?: () => void;
   rightActions?: React.ReactNode;
   showBack?: boolean;
   /** large = 2xl stack titles; medium = base (default) */
   titleSize?: ScreenHeaderTitleSize;
   /** onDark = light text on dark backgrounds (subscription plans, manage devices) */
   tone?: ScreenHeaderTone;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
   headerIcon,
   title,
   subtitle,
   onBack,
   rightActions,
   showBack = true,
   titleSize = 'medium',
   tone = 'default',
}) => {
   const { colors } = useTheme();
   const isLarge = titleSize === 'large';
   const isOnDark = tone === 'onDark';

   const headerAppearance = useMemo(() => {
      if (!headerIcon) {
         return null;
      }
      return resolveScreenHeaderIcon(headerIcon, colors);
   }, [headerIcon, colors]);

   const displayTitle = title ?? headerAppearance?.title;
   const displaySubtitle = subtitle ?? headerAppearance?.subtitle;
   const hasTitleBlock = Boolean(displayTitle || displaySubtitle);
   const showTopRow = Boolean((showBack && onBack) || rightActions);

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            paddingHorizontal: spacing.md,
            paddingTop: showTopRow ? 0 : spacing.md,
            paddingBottom: spacing.sm,
            backgroundColor: isOnDark
               ? t.colors.background.dark
               : t.colors.background.screen,
         },
         topRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 36,
         },
         backButton: {
            alignSelf: 'flex-start',
            padding: spacing.xs,
         },
         titleBlock: {
            marginTop: showTopRow ? spacing.xs : 0,
            alignSelf: 'stretch',
         },
         titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
         },
         iconSquare: {
            width: 40,
            height: 40,
            borderRadius: borderRadius.md,
            justifyContent: 'center',
            alignItems: 'center',
         },
         titleTextColumn: {
            flex: 1,
            minWidth: 0,
         },
         title: {
            fontSize: isLarge ? typography.fontSize['2xl'] : typography.fontSize.base,
            color: isOnDark ? t.colors.text.dark : t.colors.text.primary,
            ...Platform.select({
               ios: {
                  fontFamily: 'System',
                  fontWeight: isLarge ? '700' : '600',
               },
               android: {
                  fontFamily: 'sans-serif-medium',
                  fontWeight: isLarge ? '700' : '600',
               },
            }),
         },
         subtitle: {
            fontSize: typography.fontSize.sm,
            color: isOnDark ? t.colors.text.secondaryDark : t.colors.text.secondary,
            marginTop: spacing.xs,
         },
         right: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
         },
      })
   );

   const iconColor = isOnDark ? colors.text.dark : colors.text.primary;

   return (
      <View style={styles.container}>
         {showTopRow ? (
            <View style={styles.topRow}>
               {showBack && onBack ? (
                  <TouchableOpacity
                     onPress={onBack}
                     style={styles.backButton}
                     activeOpacity={0.7}
                     accessibilityLabel="Go back"
                  >
                     <Ionicons
                        name={APP_BACK_ICON}
                        size={APP_BACK_ICON_SIZE}
                        color={iconColor}
                     />
                  </TouchableOpacity>
               ) : (
                  <View />
               )}
               {rightActions ? <View style={styles.right}>{rightActions}</View> : null}
            </View>
         ) : null}

         {hasTitleBlock ? (
            <View style={styles.titleBlock}>
               <View style={styles.titleRow}>
                  {headerAppearance ? (
                     <View
                        style={[
                           styles.iconSquare,
                           { backgroundColor: headerAppearance.iconBg },
                        ]}
                     >
                        <Ionicons
                           name={headerAppearance.icon}
                           size={20}
                           color={headerAppearance.iconColor}
                        />
                     </View>
                  ) : null}
                  <View style={styles.titleTextColumn}>
                     {displayTitle ? (
                        <Text style={styles.title} numberOfLines={2}>
                           {displayTitle}
                        </Text>
                     ) : null}
                     {displaySubtitle ? (
                        <Text style={styles.subtitle} numberOfLines={2}>
                           {displaySubtitle}
                        </Text>
                     ) : null}
                  </View>
               </View>
            </View>
         ) : null}
      </View>
   );
};
