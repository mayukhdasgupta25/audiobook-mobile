import React, { useEffect, useRef, useCallback } from 'react';
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
import {
   DRAWER_SLIDE_SPRING,
   DRAWER_BACKDROP_FADE_MS,
   DRAWER_CLOSE_MS,
} from '@/theme/tabAnimation';

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
   const openAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
   const closeAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

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

   const runOpenAnimation = useCallback(() => {
      openAnimationRef.current?.stop();
      closeAnimationRef.current?.stop();
      slideAnim.setValue(-DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      setIsAnimating(true);

      // Defer one frame so Modal layout is ready before the slide begins
      requestAnimationFrame(() => {
         openAnimationRef.current = Animated.parallel([
            Animated.spring(slideAnim, {
               toValue: 0,
               ...DRAWER_SLIDE_SPRING,
            }),
            Animated.timing(backdropOpacity, {
               toValue: 1,
               duration: DRAWER_BACKDROP_FADE_MS,
               easing: Easing.out(Easing.cubic),
               useNativeDriver: true,
            }),
         ]);
         openAnimationRef.current.start(({ finished }) => {
            if (finished) {
               setIsAnimating(false);
            }
         });
      });
   }, [slideAnim, backdropOpacity]);

   const runCloseAnimation = useCallback(
      (onComplete?: () => void) => {
         openAnimationRef.current?.stop();
         closeAnimationRef.current?.stop();
         setIsAnimating(true);

         closeAnimationRef.current = Animated.parallel([
            Animated.timing(slideAnim, {
               toValue: -DRAWER_WIDTH,
               duration: DRAWER_CLOSE_MS,
               easing: Easing.in(Easing.cubic),
               useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
               toValue: 0,
               duration: DRAWER_CLOSE_MS,
               easing: Easing.in(Easing.quad),
               useNativeDriver: true,
            }),
         ]);
         closeAnimationRef.current.start(({ finished }) => {
            if (finished) {
               setIsAnimating(false);
               onComplete?.();
            }
         });
      },
      [slideAnim, backdropOpacity]
   );

   // Animate drawer open when visible becomes true
   useEffect(() => {
      if (visible) {
         runOpenAnimation();
      }
   }, [visible, runOpenAnimation]);

   const handleClose = useCallback(() => {
      runCloseAnimation(onClose);
   }, [runCloseAnimation, onClose]);

   // Handle Android back button
   useEffect(() => {
      if (!visible) return;

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
         handleClose();
         return true;
      });

      return () => backHandler.remove();
   }, [visible, handleClose]);

   const handleMenuItemPress = (item: MenuItem) => {
      runCloseAnimation(() => {
         onClose();
         item.onPress?.();
      });
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
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
      borderBottomColor: colors.border.light,
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
      backgroundColor: colors.border.light,
      marginVertical: spacing.sm,
      marginHorizontal: spacing.md,
   },
});
