import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme';
import { TabNavigationProvider } from '@/hooks/useTabNavigation';

/**
 * Tab layout with custom directional transitions
 * Wraps tabs in navigation context provider for tracking previous routes
 */
export default function TabLayout() {

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
                     height: Platform.OS === 'ios' ? 90 : 70,
                     paddingTop: Platform.OS === 'ios' ? 10 : 5,
                     paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                     elevation: 0,
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
