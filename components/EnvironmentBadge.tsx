import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppEnvironment, getEnvironmentLabel, isProduction } from '@/config/environment';

/**
 * Non-production environment indicator shown at the top of the app.
 */
export function EnvironmentBadge() {
   const insets = useSafeAreaInsets();

   if (isProduction()) {
      return null;
   }

   const label = getEnvironmentLabel(getAppEnvironment());

   return (
      <View
         style={[styles.badge, { top: insets.top + 4 }]}
         pointerEvents="none"
         accessibilityLabel={`${label} environment`}
      >
         <Text style={styles.text}>{label}</Text>
      </View>
   );
}

const styles = StyleSheet.create({
   badge: {
      position: 'absolute',
      alignSelf: 'center',
      zIndex: 9999,
      backgroundColor: 'rgba(220, 38, 38, 0.92)',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 4,
   },
   text: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      ...Platform.select({
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
});
