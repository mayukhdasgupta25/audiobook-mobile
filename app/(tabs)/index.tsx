import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
   View,
   StyleSheet,
   ScrollView,
   Platform,
   Text,
   ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { useSelector } from 'react-redux';
import { Header } from '@/components/Header';
import { NavigationPills } from '@/components/NavigationPills';
import { HeroSection } from '@/components/HeroSection';
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { colors, spacing, typography } from '@/theme';
import { useHomeContent } from '@/hooks/useHomeContent';
import { apiConfig } from '@/services/api';
import { RootState } from '@/store';

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
MemoizedHeader.displayName = 'MemoizedHeader';

const MemoizedNavigationPills = React.memo<{
   selectedTab: 'shows' | 'movies' | 'categories';
   onTabChange: (tab: 'shows' | 'movies' | 'categories') => void;
}>(({ selectedTab, onTabChange }) => (
   <NavigationPills selectedTab={selectedTab} onTabChange={onTabChange} />
));
MemoizedNavigationPills.displayName = 'MemoizedNavigationPills';

const MemoizedHeroSection = React.memo<{
   carouselItems?: Array<{ id: string; title: string; author: string; posterUri?: string }>;
   autoRotateInterval?: number;
   paused?: boolean;
   onPlayPress: () => void;
   onMyListPress: () => void;
   onIndexChange?: (index: number) => void;
}>(({ carouselItems, autoRotateInterval, paused, onPlayPress, onMyListPress, onIndexChange }) => (
   <HeroSection
      carouselItems={carouselItems}
      autoRotateInterval={autoRotateInterval}
      paused={paused}
      onPlayPress={onPlayPress}
      onMyListPress={onMyListPress}
      onIndexChange={onIndexChange}
   />
));
MemoizedHeroSection.displayName = 'MemoizedHeroSection';

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
MemoizedContentRow.displayName = 'MemoizedContentRow';


/**
 * Home screen with modern app layout
 * Features personalized header, hero section, and horizontal content rows
 */
function HomeScreenContent() {
   const [selectedTab, setSelectedTab] = useState<'shows' | 'movies' | 'categories'>('shows');
   const paginationTriggeredRef = useRef<Record<string, boolean>>({});
   const insets = useSafeAreaInsets();
   const pathname = usePathname();

   // Get user profile from Redux
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);

   // Compute display name from user profile
   // If firstName and lastName exist, use them; otherwise use username; fallback to "Mayukh"
   const displayName = useMemo(() => {
      if (userProfile) {
         if (userProfile.firstName && userProfile.lastName) {
            return `${userProfile.firstName} ${userProfile.lastName}`;
         }
         if (userProfile.username) {
            return userProfile.username;
         }
      }
      return 'Mayukh'; // Fallback if profile not loaded yet
   }, [userProfile]);

   // Check if home screen is focused (pathname matches home route)
   const isHomeFocused = useMemo(() => {
      return pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname === '/(tabs)/';
   }, [pathname]);

   // Fetch content using new hook
   const { contentRows, isLoading, error, loadNextPage, heroCarouselItems } = useHomeContent();

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
      // Navigate to details screen with audiobook ID
      router.push(`/details/${item.id}`);
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

   // Track current hero carousel index for Play button
   const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

   const handleMyListPress = useCallback(() => {
      console.log('My List pressed');
   }, []);

   // Memoize hero carousel items - convert audiobooks to carousel format
   const heroCarouselData = useMemo(() => {
      return heroCarouselItems.map((audiobook) => {
         // Use API images - prioritize homeHeroCoverImage, fallback to coverImage
         const imagePath = audiobook.homeHeroCoverImage || audiobook.coverImage;
         const posterUri = imagePath ? `${apiConfig.baseURL}${imagePath}` : undefined;

         return {
            id: audiobook.id,
            title: audiobook.title,
            author: audiobook.author,
            posterUri,
         };
      });
   }, [heroCarouselItems]);

   // Handle Play button press - navigate to details and auto-play first chapter
   const handlePlayPress = useCallback(() => {
      // Get current carousel item based on index
      const currentItem = heroCarouselData[currentHeroIndex];
      if (currentItem?.id) {
         // Navigate to details screen with autoPlay query parameter
         router.push(`/details/${currentItem.id}?autoPlay=true`);
      }
   }, [currentHeroIndex, heroCarouselData]);

   // Calculate dynamic padding for scroll content
   const scrollContentPadding = useMemo(() => {
      const tabBarBaseHeight = Platform.OS === 'ios' ? 90 : 70;
      return tabBarBaseHeight + (insets?.bottom || 0) + 20; // Extra 20px for spacing
   }, [insets]);

   return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
         <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollContentPadding }]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            removeClippedSubviews={true} // Optimize scrolling performance
            scrollEventThrottle={16} // Optimize scroll event handling
         >
            {/* Header with greeting and icons - Memoized to prevent re-renders */}
            <MemoizedHeader
               userName={displayName}
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
            {heroCarouselData.length > 0 && (
               <MemoizedHeroSection
                  carouselItems={heroCarouselData}
                  autoRotateInterval={5000}
                  paused={!isHomeFocused}
                  onPlayPress={handlePlayPress}
                  onMyListPress={handleMyListPress}
                  onIndexChange={setCurrentHeroIndex}
               />
            )}

            {/* Content rows - Tags first, then Genres */}
            <View style={styles.contentSection}>
               {isLoading && contentRows.length === 0 ? (
                  <View style={styles.loadingContainer}>
                     <ActivityIndicator size="large" color={colors.app.red} />
                     <Text style={styles.loadingText}>Loading audiobooks...</Text>
                  </View>
               ) : error ? (
                  <View style={styles.errorContainer}>
                     <Text style={styles.errorText}>
                        {typeof error === 'string' ? error : 'An error occurred'}
                     </Text>
                  </View>
               ) : contentRows.length === 0 ? (
                  <View style={styles.emptyContainer}>
                     <Text style={styles.emptyText}>No audiobooks available</Text>
                  </View>
               ) : (
                  contentRows
                     .filter((row) => row.items && row.items.length > 0)
                     .map((row) => (
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
      // Base style - paddingBottom will be set dynamically
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
