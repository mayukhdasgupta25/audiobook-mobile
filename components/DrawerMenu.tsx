import React, { useEffect, useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Modal,
   Animated,
   Easing,
   Dimensions,
   Platform,
   BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.75, 320);

interface DrawerMenuProps {
   visible: boolean;
   onClose: () => void;
   onAppSettingsPress?: () => void;
   onAccountPress?: () => void;
   onHelpPress?: () => void;
   onSignOutPress?: () => void;
}

interface MenuItem {
   id: string;
   label: string;
   icon: keyof typeof Ionicons.glyphMap;
   onPress?: () => void;
   isDanger?: boolean;
}

/**
 * Drawer menu component that slides in from the left
 * Contains navigation menu items for the app
 */
export const DrawerMenu: React.FC<DrawerMenuProps> = ({
   visible,
   onClose,
   onAppSettingsPress,
   onAccountPress,
   onHelpPress,
   onSignOutPress,
}) => {
   const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
   const backdropOpacity = useRef(new Animated.Value(0)).current;
   const [isAnimating, setIsAnimating] = React.useState(false);

   // Menu items configuration
   const menuItems: MenuItem[] = [
      {
         id: 'settings',
         label: 'App Settings',
         icon: 'settings-outline',
         onPress: onAppSettingsPress,
      },
      {
         id: 'account',
         label: 'Account',
         icon: 'person-outline',
         onPress: onAccountPress,
      },
      {
         id: 'help',
         label: 'Help',
         icon: 'help-circle-outline',
         onPress: onHelpPress,
      },
      {
         id: 'signout',
         label: 'Sign Out',
         icon: 'log-out-outline',
         onPress: onSignOutPress,
         isDanger: true,
      },
   ];

   // Animate drawer open/close
   useEffect(() => {
      if (visible) {
         // Reset to initial state before animating
         slideAnim.setValue(-DRAWER_WIDTH);
         backdropOpacity.setValue(0);
         setIsAnimating(true);

         // Opening animations
         Animated.parallel([
            Animated.timing(slideAnim, {
               toValue: 0,
               duration: 300,
               easing: Easing.bezier(0.25, 0.1, 0.25, 1),
               useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
               toValue: 0.95,
               duration: 300,
               useNativeDriver: true,
            }),
         ]).start(() => {
            setIsAnimating(false);
         });
      } else if (isAnimating) {
         // Closing animations - only animate if we were previously open
         Animated.parallel([
            Animated.timing(slideAnim, {
               toValue: -DRAWER_WIDTH,
               duration: 300,
               easing: Easing.bezier(0.25, 0.1, 0.25, 1),
               useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
               toValue: 0,
               duration: 300,
               useNativeDriver: true,
            }),
         ]).start(() => {
            setIsAnimating(false);
         });
      }
      // slideAnim and backdropOpacity are refs and don't need to be in deps
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [visible]);

   // Handle drawer close with animation
   const handleClose = React.useCallback(() => {
      // Start closing animation
      setIsAnimating(true);
      Animated.parallel([
         Animated.timing(slideAnim, {
            toValue: -DRAWER_WIDTH,
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
         }),
         Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
         }),
      ]).start(() => {
         setIsAnimating(false);
         onClose();
      });
   }, [slideAnim, backdropOpacity, onClose]);

   // Handle Android back button
   useEffect(() => {
      if (!visible) return;

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
         handleClose();
         return true; // Prevent default behavior
      });

      return () => backHandler.remove();
   }, [visible, handleClose]);

   const handleMenuItemPress = (item: MenuItem) => {
      // Close drawer with animation first
      handleClose();
      // Then execute the action after animation completes
      setTimeout(() => {
         item.onPress?.();
      }, 350);
   };

   // Don't render if not visible and not animating
   if (!visible && !isAnimating) {
      return null;
   }

   return (
      <Modal
         visible={visible || isAnimating}
         transparent
         animationType="none"
         statusBarTranslucent
         onRequestClose={handleClose}
      >
         {/* Backdrop */}
         <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleClose}
         >
            <Animated.View
               style={[
                  styles.backdropOverlay,
                  { opacity: backdropOpacity },
               ]}
            />
         </TouchableOpacity>

         {/* Drawer Container */}
         <Animated.View
            style={[
               styles.drawerContainer,
               {
                  transform: [{ translateX: slideAnim }],
                  width: DRAWER_WIDTH,
               },
            ]}
         >
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
               <Text style={styles.headerTitle}>Menu</Text>
               <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
               >
                  <Ionicons name="close" size={28} color={colors.text.dark} />
               </TouchableOpacity>
            </View>

            {/* Drawer Content */}
            <View style={styles.drawerContent}>
               {menuItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                     {/* Add divider before Sign Out */}
                     {item.isDanger && index > 0 && <View style={styles.divider} />}

                     <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleMenuItemPress(item)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        accessibilityHint={`Navigate to ${item.label}`}
                     >
                        <Ionicons
                           name={item.icon}
                           size={24}
                           color={item.isDanger ? colors.error : colors.text.dark}
                           style={styles.menuIcon}
                        />
                        <Text
                           style={[
                              styles.menuText,
                              item.isDanger && styles.menuTextDanger,
                           ]}
                        >
                           {item.label}
                        </Text>
                     </TouchableOpacity>
                  </React.Fragment>
               ))}
            </View>
         </Animated.View>
      </Modal>
   );
};

const styles = StyleSheet.create({
   backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
   },
   backdropOverlay: {
      flex: 1,
      backgroundColor: '#000000',
   },
   drawerContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      backgroundColor: colors.background.darkGrayLight,
      ...shadows.lg,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 16,
   },
   drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
   },
   headerTitle: {
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
   closeButton: {
      padding: spacing.xs,
   },
   drawerContent: {
      flex: 1,
      paddingTop: spacing.md,
   },
   menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 56,
   },
   menuIcon: {
      marginRight: spacing.md,
   },
   menuText: {
      fontSize: typography.fontSize.lg,
      fontWeight: '500',
      color: colors.text.dark,
      letterSpacing: -0.2,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   menuTextDanger: {
      color: colors.error,
   },
   divider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      marginVertical: spacing.sm,
      marginHorizontal: spacing.md,
   },
});

