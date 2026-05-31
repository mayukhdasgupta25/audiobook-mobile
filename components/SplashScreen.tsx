import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { typography } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function SplashScreen() {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flex: 1,
            backgroundColor: t.colors.background.player,
            justifyContent: 'center',
            alignItems: 'center',
         },
         title: {
            fontSize: typography.fontSize['4xl'],
            fontWeight: '700',
            color: t.colors.accent.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-bold' },
            }),
         },
      })
   );

   return (
      <View style={styles.container}>
         <Text style={styles.title}>Audiobook</Text>
      </View>
   );
}
