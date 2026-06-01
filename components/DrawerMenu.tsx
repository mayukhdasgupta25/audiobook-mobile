import React, { useEffect, useRef, useCallback } from 'react';
import {
   View,
   Text,
   Image,
   StyleSheet,
   TouchableOpacity,
   Modal,
   Animated,
   Easing,
   Dimensions,
   Platform,
   BackHandler,
   ScrollView,
   Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { RootState } from '@/store';
import { setColorScheme } from '@/store/settings';
import {
   DRAWER_SLIDE_SPRING,
   DRAWER_BACKDROP_FADE_MS,
   DRAWER_CLOSE_MS,
} from '@/theme/tabAnimation';
import { MembershipIndicator } from '@/components/profile/MembershipIndicator';
import { MembershipBanner } from '@/components/profile/MembershipBanner';
import { getMembershipLabel, type MembershipTier } from '@/utils/membershipDisplay';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

export type DrawerRoute = 'index' | 'library' | 'discover' | 'profile';

interface DrawerMenuProps {
   visible: boolean;
   onClose: () => void;
   currentRoute?: DrawerRoute;
   displayName: string;
   avatarUri?: string;
   membershipTier: MembershipTier;
   planName?: string;
   onNavigate: (href: string) => void;
   onSignOut: () => void;
}

interface NavItem {
   id: string;
   label: string;
   icon: keyof typeof Ionicons.glyphMap;
   activeIcon?: keyof typeof Ionicons.glyphMap;
   href?: string;
   isTab?: boolean;
   showBadge?: boolean;
   isDanger?: boolean;
}

function getInitials(name: string): string {
   const names = name.trim().split(' ');
   if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
   }
   return name.substring(0, 2).toUpperCase();
}

/**
 * Side drawer with user header, membership card, navigation, and dark mode shell.
 */
export const DrawerMenu: React.FC<DrawerMenuProps> = ({
   visible,
   onClose,
   currentRoute = 'index',
   displayName,
   avatarUri,
   membershipTier,
   planName,
   onNavigate,
   onSignOut,
}) => {
   const dispatch = useDispatch();
   const colorScheme = useSelector((state: RootState) => state.settings.colorScheme);
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
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
            backgroundColor: t.colors.background.drawer,
            ...t.shadows.lg,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 16,
         },
         scrollView: {
            flex: 1,
         },
         scrollContent: {
            paddingTop: Platform.OS === 'ios' ? 56 : 40,
            paddingBottom: spacing.md,
         },
         userHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
         },
         avatar: {
            width: 52,
            height: 52,
            borderRadius: borderRadius.full,
            marginRight: spacing.md,
         },
         avatarPlaceholder: {
            backgroundColor: t.colors.primary[200],
            justifyContent: 'center',
            alignItems: 'center',
         },
         avatarText: {
            fontSize: typography.fontSize.lg,
            color: t.colors.accent.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         userInfo: {
            flex: 1,
            minWidth: 0,
         },
         nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
         },
         userName: {
            fontSize: typography.fontSize.lg,
            color: t.colors.text.primary,
            flexShrink: 1,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         membershipLabel: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginTop: 2,
         },
         navSection: {
            paddingHorizontal: spacing.sm,
         },
         navItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            borderRadius: borderRadius.md,
            marginBottom: 2,
            minHeight: 44,
         },
         navItemActive: {
            backgroundColor: t.colors.background.highlight,
         },
         navIcon: {
            marginRight: spacing.md,
         },
         navText: {
            flex: 1,
            fontSize: typography.fontSize.base,
            color: t.colors.text.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '500' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         navTextActive: {
            color: t.colors.accent.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '600' },
            }),
         },
         notificationDot: {
            width: 8,
            height: 8,
            borderRadius: borderRadius.full,
            backgroundColor: t.colors.warning,
         },
         divider: {
            height: 1,
            backgroundColor: t.colors.border.light,
            marginHorizontal: spacing.md,
            marginVertical: spacing.sm,
         },
         signOutItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            marginHorizontal: spacing.sm,
            minHeight: 44,
         },
         signOutText: {
            fontSize: typography.fontSize.base,
            color: t.colors.error,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '600' },
            }),
         },
         footerDivider: {
            height: 1,
            backgroundColor: t.colors.background.highlight,
            marginBottom: spacing.md,
         },
         footer: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
         },
         darkModeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
         },
         darkModeText: {
            flex: 1,
            fontSize: typography.fontSize.base,
            color: t.colors.text.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '500' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
      })
   );

   const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
   const backdropOpacity = useRef(new Animated.Value(0)).current;
   const [isAnimating, setIsAnimating] = React.useState(false);
   const openAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
   const closeAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

   const navItems: NavItem[] = [
      {
         id: 'home',
         label: 'Home',
         icon: 'home-outline',
         activeIcon: 'home',
         href: '/(tabs)',
         isTab: true,
      },
      {
         id: 'library',
         label: 'Library',
         icon: 'library-outline',
         activeIcon: 'library',
         href: '/(tabs)/library',
         isTab: true,
      },
      {
         id: 'discover',
         label: 'Discover',
         icon: 'compass-outline',
         activeIcon: 'compass',
         href: '/(tabs)/discover',
         isTab: true,
      },
      {
         id: 'favorites',
         label: 'Favorites',
         icon: 'heart-outline',
         href: '/library/favorites',
      },
      {
         id: 'downloads',
         label: 'Downloads',
         icon: 'download-outline',
         href: '/library/downloads',
      },
      {
         id: 'history',
         label: 'Listening History',
         icon: 'time-outline',
         href: '/library/listening-history',
      },
      {
         id: 'bookmarks',
         label: 'My Bookmarks',
         icon: 'bookmark-outline',
         href: '/library/bookmarks',
      },
      {
         id: 'notifications',
         label: 'Notifications',
         icon: 'notifications-outline',
         showBadge: true,
      },
      {
         id: 'settings',
         label: 'Settings',
         icon: 'settings-outline',
         href: '/settings',
      },
      {
         id: 'help',
         label: 'Help & Support',
         icon: 'help-circle-outline',
      },
   ];

   const runOpenAnimation = useCallback(() => {
      openAnimationRef.current?.stop();
      closeAnimationRef.current?.stop();
      slideAnim.setValue(-DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      setIsAnimating(true);

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

   useEffect(() => {
      if (visible) {
         runOpenAnimation();
      }
   }, [visible, runOpenAnimation]);

   const handleClose = useCallback(() => {
      runCloseAnimation(onClose);
   }, [runCloseAnimation, onClose]);

   useEffect(() => {
      if (!visible) return;

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
         handleClose();
         return true;
      });

      return () => backHandler.remove();
   }, [visible, handleClose]);

   const handleItemPress = (item: NavItem) => {
      runCloseAnimation(() => {
         onClose();
         if (item.href) {
            onNavigate(item.href);
         }
      });
   };

   const handleSignOutPress = () => {
      runCloseAnimation(() => {
         onClose();
         onSignOut();
      });
   };

   const handleBannerPress = () => {
      runCloseAnimation(() => {
         onClose();
         onNavigate('/subscription-plans');
      });
   };

   const isItemActive = (item: NavItem): boolean => {
      if (!item.isTab) return false;
      return item.id === currentRoute || (item.id === 'home' && currentRoute === 'index');
   };

   if (!visible && !isAnimating) {
      return null;
   }

   const membershipLabel = getMembershipLabel(membershipTier, planName);

   return (
      <Modal
         visible={visible || isAnimating}
         transparent
         animationType="none"
         statusBarTranslucent
         onRequestClose={handleClose}
      >
         <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
            <Animated.View style={[styles.backdropOverlay, { opacity: backdropOpacity }]} />
         </TouchableOpacity>

         <Animated.View
            style={[
               styles.drawerContainer,
               {
                  transform: [{ translateX: slideAnim }],
                  width: DRAWER_WIDTH,
               },
            ]}
         >
            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={styles.scrollContent}
               showsVerticalScrollIndicator={false}
            >
               <View style={styles.userHeader}>
                  {avatarUri ? (
                     <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                     <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                     </View>
                  )}
                  <View style={styles.userInfo}>
                     <View style={styles.nameRow}>
                        <Text style={styles.userName} numberOfLines={1}>
                           {displayName}
                        </Text>
                        <MembershipIndicator tier={membershipTier} size={16} />
                     </View>
                     <Text style={styles.membershipLabel}>{membershipLabel}</Text>
                  </View>
               </View>

               <MembershipBanner
                  variant="drawer"
                  tier={membershipTier}
                  planName={planName}
                  onPress={handleBannerPress}
               />

               <View style={styles.navSection}>
                  {navItems.map((item) => {
                     const active = isItemActive(item);
                     const iconName = active && item.activeIcon ? item.activeIcon : item.icon;

                     return (
                        <TouchableOpacity
                           key={item.id}
                           style={[styles.navItem, active && styles.navItemActive]}
                           onPress={() => handleItemPress(item)}
                           activeOpacity={0.7}
                           accessibilityRole="button"
                           accessibilityLabel={item.label}
                        >
                           <Ionicons
                              name={iconName}
                              size={22}
                              color={active ? colors.accent.primary : colors.text.primary}
                              style={styles.navIcon}
                           />
                           <Text
                              style={[styles.navText, active && styles.navTextActive]}
                           >
                              {item.label}
                           </Text>
                           {item.showBadge ? <View style={styles.notificationDot} /> : null}
                        </TouchableOpacity>
                     );
                  })}
               </View>

               <View style={styles.divider} />

               <TouchableOpacity
                  style={styles.signOutItem}
                  onPress={handleSignOutPress}
                  activeOpacity={0.7}
               >
                  <Ionicons
                     name="log-out-outline"
                     size={22}
                     color={colors.error}
                     style={styles.navIcon}
                  />
                  <Text style={styles.signOutText}>Log Out</Text>
               </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
               <View style={styles.footerDivider} />
               <View style={styles.darkModeRow}>
                  <Ionicons
                     name="moon-outline"
                     size={22}
                     color={colors.text.primary}
                     style={styles.navIcon}
                  />
                  <Text style={styles.darkModeText}>Dark Mode</Text>
                  <Switch
                     value={colorScheme === 'dark'}
                     onValueChange={(value) => {
                        dispatch(setColorScheme(value ? 'dark' : 'light'));
                     }}
                     trackColor={{
                        false: colors.border.medium,
                        true: colors.primary[300],
                     }}
                     thumbColor={colors.background.screen}
                  />
               </View>
            </View>
         </Animated.View>
      </Modal>
   );
};
