import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme';
import {
   getTabBarInnerHeight,
   getTabBarPaddingTop,
   getTabBarPaddingBottom,
} from '@/theme/tabLayout';
import { TabNavigationProvider } from '@/hooks/useTabNavigation';
import { FloatingTabBar } from '@/components/FloatingTabBar';

export default function TabLayout() {
   const tabBarInnerHeight = getTabBarInnerHeight();
   const sceneStyle = { backgroundColor: colors.background.screen };

   return (
      <TabNavigationProvider>
         <View style={{ flex: 1, backgroundColor: colors.background.screen, overflow: 'hidden' }}>
            <Tabs
               tabBar={(props) => <FloatingTabBar {...props} />}
               screenOptions={{
                  headerShown: false,
                  lazy: false,
                  tabBarActiveTintColor: colors.accent.primary,
                  tabBarInactiveTintColor: colors.text.muted,
                  sceneStyle,
                  tabBarStyle: {
                     display: Platform.OS === 'web' ? 'none' : 'flex',
                     backgroundColor: 'transparent',
                     borderTopWidth: 0,
                     height: tabBarInnerHeight,
                     paddingTop: getTabBarPaddingTop(),
                     paddingBottom: getTabBarPaddingBottom(),
                     elevation: 0,
                     shadowOpacity: 0,
                  },
                  tabBarLabelStyle: {
                     fontSize: typography.fontSize.xs,
                     fontWeight: '500',
                     marginTop: 2,
                     ...Platform.select({
                        ios: { fontFamily: 'System', fontWeight: '500' },
                        android: { fontFamily: 'sans-serif' },
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
                  }}
               />
               <Tabs.Screen
                  name="library"
                  options={{
                     title: 'Library',
                     tabBarIcon: ({ color, size }) => (
                        <Ionicons name="library-outline" size={size} color={color} />
                     ),
                  }}
               />
               <Tabs.Screen
                  name="discover"
                  options={{
                     title: 'Discover',
                     tabBarIcon: ({ color, size }) => (
                        <Ionicons name="compass-outline" size={size} color={color} />
                     ),
                  }}
               />
               <Tabs.Screen
                  name="profile"
                  options={{
                     title: 'Profile',
                     tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                     ),
                  }}
               />
               <Tabs.Screen
                  name="new-hot"
                  options={{
                     href: null,
                  }}
               />
            </Tabs>
         </View>
      </TabNavigationProvider>
   );
}
