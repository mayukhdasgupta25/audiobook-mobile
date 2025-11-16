import React, { useState, useMemo, useCallback } from 'react';
import {
   View,
   StyleSheet,
   ScrollView,
   Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { NavigationPills } from '@/components/NavigationPills';
import { HeroSection } from '@/components/HeroSection';
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { colors } from '@/theme';

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
   onPlayPress: () => void;
   onMyListPress: () => void;
}>(({ title, languages, onPlayPress, onMyListPress }) => (
   <HeroSection
      title={title}
      languages={languages}
      onPlayPress={onPlayPress}
      onMyListPress={onMyListPress}
   />
));

const MemoizedContentRow = React.memo<{
   title: string;
   items: ContentItem[];
   onItemPress: (item: ContentItem) => void;
}>(({ title, items, onItemPress }) => (
   <ContentRow title={title} items={items} onItemPress={onItemPress} />
));

/**
 * Home screen with modern app layout
 * Features personalized header, hero section, and horizontal content rows
 */
function HomeScreenContent() {
   const [selectedTab, setSelectedTab] = useState<'shows' | 'movies' | 'categories'>('shows');

   // Memoize sample data to prevent recreation on every render
   const trendingData: ContentItem[] = useMemo(() => [
      { id: 't1', title: 'Action Thriller Series' },
      { id: 't2', title: 'Comedy Special' },
      { id: 't3', title: 'Sci-Fi Adventure' },
      { id: 't4', title: 'Drama Series' },
      { id: 't5', title: 'Documentary' },
   ], []);

   const continueWatchingData: ContentItem[] = useMemo(() => [
      { id: 'c1', title: 'Your Last Watch' },
      { id: 'c2', title: 'Popular Now' },
      { id: 'c3', title: 'New Releases' },
      { id: 'c4', title: 'Top Picks' },
   ], []);

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

   // Memoize languages array to prevent HeroSection re-renders
   const heroLanguages = useMemo(() => ['Hindi', 'English', 'Tamil', 'Telugu'], []);

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
               title="BARAMULLA"
               languages={heroLanguages}
               onPlayPress={handlePlayPress}
               onMyListPress={handleMyListPress}
            />

            {/* Content rows - Each memoized to prevent re-renders when other rows update */}
            <View style={styles.contentSection}>
               <MemoizedContentRow
                  title="Trending Now"
                  items={trendingData}
                  onItemPress={handleItemPress}
               />

               <MemoizedContentRow
                  title="Continue Watching"
                  items={continueWatchingData}
                  onItemPress={handleItemPress}
               />
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
