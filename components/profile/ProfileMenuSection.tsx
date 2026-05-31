import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

export interface ProfileMenuItem {
   id: string;
   title: string;
   subtitle: string;
   icon: keyof typeof Ionicons.glyphMap;
   iconBg: string;
   iconColor: string;
   onPress?: () => void;
   isDanger?: boolean;
}

interface ProfileMenuSectionProps {
   title: string;
   items: ProfileMenuItem[];
   showViewAll?: boolean;
   onViewAllPress?: () => void;
}

export const ProfileMenuSection: React.FC<ProfileMenuSectionProps> = ({
   title,
   items,
   showViewAll = false,
   onViewAllPress,
}) => {
   return (
      <View style={styles.section}>
         {title ? (
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>{title}</Text>
               {showViewAll ? (
                  <TouchableOpacity onPress={onViewAllPress} activeOpacity={0.7}>
                     <Text style={styles.viewAll}>View All</Text>
                  </TouchableOpacity>
               ) : null}
            </View>
         ) : null}

         <View style={styles.card}>
            {items.map((item, index) => (
               <React.Fragment key={item.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <TouchableOpacity
                     style={styles.row}
                     onPress={item.onPress}
                     activeOpacity={item.onPress ? 0.7 : 1}
                     disabled={!item.onPress}
                  >
                     <View style={[styles.iconSquare, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon} size={20} color={item.iconColor} />
                     </View>
                     <View style={styles.rowContent}>
                        <Text
                           style={[
                              styles.rowTitle,
                              item.isDanger && styles.rowTitleDanger,
                           ]}
                        >
                           {item.title}
                        </Text>
                        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                     </View>
                     <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.text.secondaryDark}
                     />
                  </TouchableOpacity>
               </React.Fragment>
            ))}
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   section: {
      marginBottom: spacing.lg,
   },
   sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   sectionTitle: {
      fontSize: typography.fontSize.lg,
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
      }),
   },
   viewAll: {
      fontSize: typography.fontSize.sm,
      color: colors.accent.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   card: {
      backgroundColor: colors.background.card,
      marginHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: 'hidden',
   },
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      minHeight: 72,
   },
   iconSquare: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
   },
   rowContent: {
      flex: 1,
      marginRight: spacing.sm,
   },
   rowTitle: {
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      marginBottom: 2,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   rowTitleDanger: {
      color: colors.error,
   },
   rowSubtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
   },
   divider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginLeft: spacing.md + 40 + spacing.md,
   },
});
