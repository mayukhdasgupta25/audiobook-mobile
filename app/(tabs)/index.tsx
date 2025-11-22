import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
   View,
   StyleSheet,
   ScrollView,
   Platform,
   Text,
   ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { NavigationPills } from '@/components/NavigationPills';
import { HeroSection } from '@/components/HeroSection';
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { colors, spacing, typography } from '@/theme';
import { useHomeContent } from '@/hooks/useHomeContent';

// Memoized section components to prevent re-renders when other sections update
const MemoizedHeader = React.memo<{
   userName: string;
   onCastPress: () => void;
   onDownloadPress: () => void;
   onSearchPress: () => void;
   onNotificationPress: () => void;
}>(({ userName, onCastPress, onDownloadPress, onSearchPress, onNotificationPress }) => (
   <Header
      userName={userName}
      onCastPress={onCastPress}
      onDownloadPress={onDownloadPress}
      onSearchPress={onSearchPress}
      onNotificationPress={onNotificationPress}
   />
));

const MemoizedNavigationPills = React.memo<{
   selectedTab: 'shows' | 'movies' | 'categories';
   onTabChange: (tab: 'shows' | 'movies' | 'categories') => void;
}>(({ selectedTab, onTabChange }) => (
   <NavigationPills selectedTab={selectedTab} onTabChange={onTabChange} />
));

const MemoizedHeroSection = React.memo<{
   title: string;
   languages: string[];
   posterUri?: string;
   onPlayPress: () => void;
   onMyListPress: () => void;
}>(({ title, languages, posterUri, onPlayPress, onMyListPress }) => (
   <HeroSection
      title={title}
      languages={languages}
      posterUri={posterUri}
      onPlayPress={onPlayPress}
      onMyListPress={onMyListPress}
   />
));

const MemoizedContentRow = React.memo<{
   title: string;
   items: ContentItem[];
   onItemPress: (item: ContentItem) => void;
   onEndReached?: () => void;
}>(({ title, items, onItemPress, onEndReached }) => (
   <ContentRow
      title={title}
      items={items}
      onItemPress={onItemPress}
      onEndReached={onEndReached}
   />
));


/**
 * Home screen with modern app layout
 * Features personalized header, hero section, and horizontal content rows
 */
function HomeScreenContent() {
   const [selectedTab, setSelectedTab] = useState<'shows' | 'movies' | 'categories'>('shows');
   const paginationTriggeredRef = useRef<Record<string, boolean>>({});

   // Fetch content using new hook
   const { contentRows, isLoading, error, loadNextPage } = useHomeContent();

   // Get first audiobook from first tag row for hero section
   const heroAudiobook = useMemo(() => {
      const firstTagRow = contentRows.find((row) => row.type === 'tag');
      if (firstTagRow && firstTagRow.items.length > 0) {
         // We need the full audiobook data, but we only have ContentItem
         // For now, we'll use the first item's data
         return firstTagRow.items[0];
      }
      return null;
   }, [contentRows]);

   // Handle pagination when user scrolls near end of a specific row
   const handleEndReached = useCallback(
      (rowId: string) => {
         const row = contentRows.find((r) => r.id === rowId);
         if (
            row &&
            row.pagination?.hasNextPage &&
            !paginationTriggeredRef.current[rowId] &&
            !row.isLoading
         ) {
            paginationTriggeredRef.current[rowId] = true;
            loadNextPage(rowId);
            // Reset flag after a delay to allow next pagination
            setTimeout(() => {
               paginationTriggeredRef.current[rowId] = false;
            }, 1000);
         }
      },
      [contentRows, loadNextPage]
   );

   // Memoize handlers to prevent unnecessary re-renders of child components
   const handleItemPress = useCallback((item: ContentItem) => {
      // Navigate to details screen
      console.log('Pressed item:', item.title);
   }, []);

   const handleSearchPress = useCallback(() => {
      router.push('/search');
   }, []);

   const handleTabChange = useCallback((tab: 'shows' | 'movies' | 'categories') => {
      setSelectedTab(tab);
   }, []);

   // Memoize other handlers
   const handleCastPress = useCallback(() => {
      console.log('Cast pressed');
   }, []);

   const handleDownloadPress = useCallback(() => {
      console.log('Download pressed');
   }, []);

   const handleNotificationPress = useCallback(() => {
      console.log('Notification pressed');
   }, []);

   const handlePlayPress = useCallback(() => {
      console.log('Play pressed');
   }, []);

   const handleMyListPress = useCallback(() => {
      console.log('My List pressed');
   }, []);

   // Memoize languages array - default languages for now
   const heroLanguages = useMemo(() => {
      return ['Hindi', 'English', 'Tamil', 'Telugu'];
   }, []);

   // Memoize hero title
   const heroTitle = useMemo(() => {
      return heroAudiobook?.title || 'BARAMULLA';
   }, [heroAudiobook]);

   // Memoize hero image
   const heroImageUri = useMemo(() => {
      return heroAudiobook?.imageUri || undefined;
   }, [heroAudiobook]);

   return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
         <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            removeClippedSubviews={true} // Optimize scrolling performance
            scrollEventThrottle={16} // Optimize scroll event handling
         >
            {/* Header with greeting and icons - Memoized to prevent re-renders */}
            <MemoizedHeader
               userName="Mayukh"
               onCastPress={handleCastPress}
               onDownloadPress={handleDownloadPress}
               onSearchPress={handleSearchPress}
               onNotificationPress={handleNotificationPress}
            />

            {/* Navigation pills - Memoized to prevent re-renders */}
            <MemoizedNavigationPills
               selectedTab={selectedTab}
               onTabChange={handleTabChange}
            />

            {/* Hero section - Memoized to prevent re-renders */}
            <MemoizedHeroSection
               title={heroTitle}
               languages={heroLanguages}
               posterUri={heroImageUri}
               onPlayPress={handlePlayPress}
               onMyListPress={handleMyListPress}
            />

            {/* Content rows - Tags first, then Genres */}
            <View style={styles.contentSection}>
               {isLoading && contentRows.length === 0 ? (
                  <View style={styles.loadingContainer}>
                     <ActivityIndicator size="large" color={colors.app.red} />
                     <Text style={styles.loadingText}>Loading audiobooks...</Text>
                  </View>
               ) : error ? (
                  <View style={styles.errorContainer}>
                     <Text style={styles.errorText}>{error}</Text>
                  </View>
               ) : contentRows.length === 0 ? (
                  <View style={styles.emptyContainer}>
                     <Text style={styles.emptyText}>No audiobooks available</Text>
                  </View>
               ) : (
                  contentRows.map((row) => (
                     <MemoizedContentRow
                        key={row.id}
                        title={row.title}
                        items={row.items}
                        onItemPress={handleItemPress}
                        onEndReached={() => handleEndReached(row.id)}
                     />
                  ))
               )}
            </View>
         </ScrollView>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Space for bottom tab bar
   },
   contentSection: {
      backgroundColor: colors.background.dark,
   },
   loadingContainer: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
   },
   loadingText: {
      marginTop: spacing.md,
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
   },
   errorContainer: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
   },
   errorText: {
      fontSize: typography.fontSize.base,
      color: colors.app.red,
      textAlign: 'center',
   },
   emptyContainer: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
   },
   emptyText: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      textAlign: 'center',
   },
});

/**
 * Home screen wrapper with animation
 * Always transitions from left to right
 */
export default function HomeScreen() {
   return (
      <AnimatedTabScreen direction="left" currentRoute="index">
         <HomeScreenContent />
      </AnimatedTabScreen>
   );
}
