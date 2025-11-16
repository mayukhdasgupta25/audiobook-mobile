import { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { colors, typography, spacing } from '@/theme';

export default function DetailsScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   useEffect(() => {
      if (isInitialized && !isAuthenticated) {
         router.replace('/signin');
      }
   }, [isAuthenticated, isInitialized]);

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.content}>
            <Text style={styles.title}>Details Screen</Text>
            <Text style={styles.idText}>ID: {id}</Text>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
   },
   content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
   },
   title: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: '600',
      marginBottom: spacing.md,
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
   idText: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      fontWeight: '400',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
});

