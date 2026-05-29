import React, { useCallback, useMemo } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   Platform,
   ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { colors, spacing, typography } from '@/theme';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';
import { useHomeContent } from '@/hooks/useHomeContent';

function LibraryScreenContent() {
   const insets = useSafeAreaInsets();
   const { contentRows, isLoading, error } = useHomeContent();

   const savedItems = useMemo(() => {
      const allItems: ContentItem[] = [];
      contentRows.forEach((row) => {
         row.items.forEach((item) => {
            if (!allItems.find((i) => i.id === item.id)) {
               allItems.push(item);
            }
         });
      });
      return allItems.slice(0, 12);
   }, [contentRows]);

   const handleItemPress = useCallback((item: ContentItem) => {
      router.push(`/details/${item.id}`);
   }, []);

   const scrollPadding = getTabScreenPaddingBottom(insets.bottom);

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.header}>
            <Text style={styles.title}>Library</Text>
            <Text style={styles.subtitle}>Saved, downloaded, and listened</Text>
         </View>
         <ScrollView
            contentContainerStyle={{ paddingBottom: scrollPadding }}
            showsVerticalScrollIndicator={false}
         >
            {isLoading && savedItems.length === 0 ? (
               <View style={styles.center}>
                  <ActivityIndicator size="large" color={colors.accent.primary} />
               </View>
            ) : error ? (
               <View style={styles.center}>
                  <Text style={styles.errorText}>Unable to load library</Text>
               </View>
            ) : savedItems.length === 0 ? (
               <View style={styles.center}>
                  <Text style={styles.emptyText}>Your library is empty</Text>
                  <Text style={styles.emptyHint}>Start listening to build your collection</Text>
               </View>
            ) : (
               <ContentRow
                  title="Recently added"
                  items={savedItems}
                  onItemPress={handleItemPress}
               />
            )}
         </ScrollView>
      </SafeAreaView>
   );
}

export default function LibraryScreen() {
   return (
      <AnimatedTabScreen direction="right" currentRoute="library">
         <LibraryScreenContent />
      </AnimatedTabScreen>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
   },
   title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: '700',
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   subtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.xs,
   },
   center: {
      padding: spacing.xxl,
      alignItems: 'center',
   },
   emptyText: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
   },
   emptyHint: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.sm,
      textAlign: 'center',
   },
   errorText: {
      color: colors.error,
   },
});
