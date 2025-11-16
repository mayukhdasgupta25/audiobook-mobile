import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

interface HeaderProps {
   userName?: string;
   onCastPress?: () => void;
   onDownloadPress?: () => void;
   onSearchPress?: () => void;
   onNotificationPress?: () => void;
}

/**
 * Header component with personalized greeting and action icons
 * Modern app header design
 */
const HeaderComponent: React.FC<HeaderProps> = ({
   userName = 'Mayukh',
   onCastPress,
   onDownloadPress,
   onSearchPress,
   onNotificationPress,
}) => {
   return (
      <SafeAreaView edges={['top']} style={styles.container}>
         <View style={styles.content}>
            {/* Personalized greeting */}
            <Text style={styles.greeting}>For {userName}</Text>

            {/* Action icons */}
            <View style={styles.iconsContainer}>
               <TouchableOpacity
                  onPress={onCastPress}
                  style={styles.iconButton}
                  activeOpacity={0.7}
               >
                  <Ionicons name="tv-outline" size={24} color={colors.text.dark} />
               </TouchableOpacity>

               <TouchableOpacity
                  onPress={onDownloadPress}
                  style={styles.iconButton}
                  activeOpacity={0.7}
               >
                  <Ionicons
                     name="download-outline"
                     size={24}
                     color={colors.text.dark}
                  />
               </TouchableOpacity>

               <TouchableOpacity
                  onPress={onSearchPress}
                  style={styles.iconButton}
                  activeOpacity={0.7}
               >
                  <Ionicons name="search-outline" size={24} color={colors.text.dark} />
               </TouchableOpacity>

               <TouchableOpacity
                  onPress={onNotificationPress}
                  style={styles.iconButton}
                  activeOpacity={0.7}
               >
                  <Ionicons
                     name="notifications-outline"
                     size={24}
                     color={colors.text.dark}
                  />
               </TouchableOpacity>
            </View>
         </View>
      </SafeAreaView>
   );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const Header = React.memo(HeaderComponent);

const styles = StyleSheet.create({
   container: {
      backgroundColor: colors.background.dark,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
   },
   content: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   greeting: {
      fontSize: typography.fontSize.xl,
      fontWeight: '600',
      color: colors.text.dark,
      letterSpacing: -0.3,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   iconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginRight: -spacing.xs,
   },
   iconButton: {
      padding: spacing.xs,
   },
});

