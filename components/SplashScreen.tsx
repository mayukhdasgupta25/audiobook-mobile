import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, typography } from '@/theme';

/**
 * Splash screen component with black background and red "Audiobook" text
 * Displays during app initialization
 */
export default function SplashScreen() {
   return (
      <View style={styles.container}>
         <Text style={styles.title}>Audiobook</Text>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
      justifyContent: 'center',
      alignItems: 'center',
   },
   title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: '700',
      color: colors.app.red,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '700',
         },
         android: {
            fontFamily: 'sans-serif-bold',
         },
      }),
   },
});

