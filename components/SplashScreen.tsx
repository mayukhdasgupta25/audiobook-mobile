import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, typography } from '@/theme';

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
      backgroundColor: colors.background.player,
      justifyContent: 'center',
      alignItems: 'center',
   },
   title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: '700',
      color: colors.accent.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-bold' },
      }),
   },
});
