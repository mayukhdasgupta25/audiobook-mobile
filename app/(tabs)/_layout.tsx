import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '@/theme';
import { TabNavigationProvider } from '@/hooks/useTabNavigation';

/**
 * Tab layout with custom directional transitions
 * Wraps tabs in navigation context provider for tracking previous routes
 */
export default function TabLayout() {
   const insets = useSafeAreaInsets();

   // Calculate tab bar height and padding accounting for safe area insets
   const tabBarBaseHeight = Platform.OS === 'ios' ? 60 : 50; // Base height without safe area
   const tabBarPaddingTop = Platform.OS === 'ios' ? 10 : 5;
   const tabBarPaddingBottom = Platform.OS === 'ios' ? 20 : 5;

   // Total height includes base height + top padding + bottom padding + bottom safe area inset
   const tabBarHeight = tabBarBaseHeight + tabBarPaddingTop + tabBarPaddingBottom + insets.bottom;
   // Bottom padding includes the safe area inset to push content above system navigation
   const tabBarBottomPadding = tabBarPaddingBottom + insets.bottom;

   return (
      <TabNavigationProvider>
         <View style={{ flex: 1, backgroundColor: colors.background.dark, overflow: 'hidden' }}>
            <Tabs
               screenOptions={{
                  headerShown: false,
                  tabBarActiveTintColor: colors.text.dark,
                  tabBarInactiveTintColor: colors.text.secondaryDark,
                  // Set dark background for all tab screens by default
                  sceneStyle: {
                     backgroundColor: colors.background.dark,
                  },
                  tabBarStyle: {
                     display: Platform.OS === 'web' ? 'none' : 'flex',
                     backgroundColor: colors.background.darkGray,
                     borderTopWidth: 0,
                     height: tabBarHeight,
                     paddingTop: tabBarPaddingTop,
                     paddingBottom: tabBarBottomPadding,
                     // Ensure tab bar is above AudioPlayer (which has zIndex 100)
                     zIndex: 200,
                     elevation: 200, // Android elevation (above AudioPlayer elevation 100)
                     shadowOpacity: 0,
                  },
                  tabBarLabelStyle: {
                     fontSize: typography.fontSize.xs,
                     fontWeight: '500',
                     marginTop: 4,
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
               }}
            >
               <Tabs.Screen
                  name="index"
                  options={{
                     title: 'Home',
                     tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                     ),
                     // Ensure dark background for this screen
                     sceneStyle: {
                        backgroundColor: colors.background.dark,
                     },
                  }}
               />
               <Tabs.Screen
                  name="new-hot"
                  options={{
                     title: 'New & Hot',
                     tabBarIcon: ({ color, size }) => (
                        <Ionicons name="flash" size={size} color={color} />
                     ),
                     // Ensure dark background for this screen
                     sceneStyle: {
                        backgroundColor: colors.background.dark,
                     },
                  }}
               />
               <Tabs.Screen
                  name="profile"
                  options={{
                     title: 'My AudioBook',
                     tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle-outline" size={size} color={color} />
                     ),
                     // Ensure dark background for this screen
                     sceneStyle: {
                        backgroundColor: colors.background.dark,
                     },
                  }}
               />
            </Tabs>
         </View>
      </TabNavigationProvider>
   );
}
