import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   Platform,
   ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { typography, spacing } from '@/theme';

const LAUNCH_BACKGROUND = '#E8DCC4';
const LAUNCH_TITLE_COLOR = '#1A1A1A';
const LAUNCH_SPINNER_COLOR = '#6F431B';

export default function SplashScreen() {
   const styles = StyleSheet.create({
      container: {
         flex: 1,
         backgroundColor: LAUNCH_BACKGROUND,
         justifyContent: 'center',
         alignItems: 'center',
         paddingHorizontal: spacing.xl,
      },
      logo: {
         width: 220,
         height: 220,
         marginBottom: spacing.lg,
      },
      title: {
         fontSize: typography.fontSize['4xl'],
         fontWeight: '700',
         color: LAUNCH_TITLE_COLOR,
         marginBottom: spacing.xl,
         ...Platform.select({
            ios: { fontFamily: 'System', fontWeight: '700' },
            android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
         }),
      },
   });

   return (
      <View style={styles.container}>
         <Image
            source={require('@/assets/images/srota-launch-logo.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Srota logo"
         />
         <Text style={styles.title}>Srota</Text>
         <ActivityIndicator size="large" color={LAUNCH_SPINNER_COLOR} />
      </View>
   );
}
