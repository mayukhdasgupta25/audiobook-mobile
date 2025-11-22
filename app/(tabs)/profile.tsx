import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ProfileHeader } from '@/components/ProfileHeader';
import { DownloadsCard } from '@/components/DownloadsCard';
import { StoryCardWithShare } from '@/components/StoryCardWithShare';
import { ContentRow, ContentItem } from '@/components/ContentRow';
import { DrawerMenu } from '@/components/DrawerMenu';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { colors, spacing, typography } from '@/theme';
import { logout } from '@/utils/logout';

// Memoized section components to prevent re-renders when other sections update
const MemoizedProfileHeader = React.memo<{
   userName: string;
   onAvatarPress: () => void;
   onCastPress: () => void;
   onSearchPress: () => void;
   onMenuPress: () => void;
}>(({ userName, onAvatarPress, onCastPress, onSearchPress, onMenuPress }) => (
   <ProfileHeader
      userName={userName}
      onAvatarPress={onAvatarPress}
      onCastPress={onCastPress}
      onSearchPress={onSearchPress}
      onMenuPress={onMenuPress}
   />
));

const MemoizedDownloadsCard = React.memo<{
   onPress: () => void;
}>(({ onPress }) => <DownloadsCard onPress={onPress} />);

const MemoizedContentRow = React.memo<{
   title: string;
   items: ContentItem[];
   showMyListLink: boolean;
   onItemPress: (item: ContentItem) => void;
   onMyListPress: () => void;
}>(({ title, items, showMyListLink, onItemPress, onMyListPress }) => (
   <ContentRow
      title={title}
      items={items}
      showMyListLink={showMyListLink}
      onItemPress={onItemPress}
      onMyListPress={onMyListPress}
   />
));

// Memoized story card component to prevent re-renders
const MemoizedStoryCard = React.memo<{
   story: ContentItem;
   shareMessage: string;
   onPress: (item: ContentItem) => void;
}>(({ story, shareMessage, onPress }) => {
   const handlePress = useCallback(() => {
      onPress(story);
   }, [story, onPress]);

   return (
      <StoryCardWithShare
         title={story.title}
         imageUri={story.imageUri}
         onPress={handlePress}
         shareMessage={shareMessage}
      />
   );
}, (prevProps, nextProps) => {
   return (
      prevProps.story.id === nextProps.story.id &&
      prevProps.story.title === nextProps.story.title &&
      prevProps.story.imageUri === nextProps.story.imageUri &&
      prevProps.shareMessage === nextProps.shareMessage &&
      prevProps.onPress === nextProps.onPress
   );
});

// Sample data interfaces
interface LikedStory extends ContentItem {
   author?: string;
}

/**
 * Profile screen content - Netflix "My Netflix" style
 * Features user profile, downloads, liked stories, my list, and listened previews
 */
function ProfileScreenContent() {
   // Drawer menu state
   const [drawerVisible, setDrawerVisible] = useState(false);

   // Memoize sample data to prevent recreation on every render
   const likedStories: LikedStory[] = useMemo(() => [
      { id: 'l1', title: 'All of Us Are Dead', author: 'Mystery Author' },
      { id: 'l2', title: 'Peaky Blinders', author: 'Drama Author' },
   ], []);

   const myListStories: ContentItem[] = useMemo(() => [
      { id: 'm1', title: 'Lucifer' },
      { id: 'm2', title: 'Dark' },
      { id: 'm3', title: 'Manifest' },
      { id: 'm4', title: 'Lupin' },
   ], []);

   const listenedPreviews: ContentItem[] = useMemo(() => [
      { id: 'p1', title: 'The Silent Patient' },
      { id: 'p2', title: 'Project Hail Mary' },
      { id: 'p3', title: 'Atomic Habits' },
   ], []);

   // Memoize handlers to prevent unnecessary re-renders of child components
   const handleStoryPress = useCallback((item: ContentItem) => {
      console.log('Story pressed:', item.title);
      // TODO: Navigate to story details
   }, []);

   const handleDownloadsPress = useCallback(() => {
      console.log('Downloads pressed');
      // TODO: Navigate to downloads screen
   }, []);

   const handleMyListSeeAll = useCallback(() => {
      console.log('My List - See All pressed');
      // TODO: Navigate to full My List screen
   }, []);

   // Drawer menu handlers - memoized
   const handleMenuPress = useCallback(() => {
      setDrawerVisible(true);
   }, []);

   const handleCloseDrawer = useCallback(() => {
      setDrawerVisible(false);
   }, []);

   const handleAppSettingsPress = useCallback(() => {
      console.log('App Settings pressed');
      // TODO: Navigate to app settings screen
   }, []);

   const handleAccountPress = useCallback(() => {
      console.log('Account pressed');
      // TODO: Navigate to account management screen
   }, []);

   const handleHelpPress = useCallback(() => {
      console.log('Help pressed');
      // TODO: Navigate to help/FAQ screen or open external link
   }, []);

   const handleSignOutPress = useCallback(async () => {
      // Clear all reducers and redirect to signin
      try {
         await logout();
      } catch (error) {
         // Log error but don't show to user - logout API failure means state wasn't cleared
         console.error('[Profile] Logout failed:', error);
      }
   }, []);

   const handleSearchPress = useCallback(() => {
      router.push('/search');
   }, []);

   const handleAvatarPress = useCallback(() => {
      console.log('Avatar pressed');
   }, []);

   const handleCastPress = useCallback(() => {
      console.log('Cast pressed');
   }, []);

   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            removeClippedSubviews={true} // Optimize scrolling performance
            scrollEventThrottle={16} // Optimize scroll event handling
         >
            {/* Profile Header - Memoized to prevent re-renders */}
            <MemoizedProfileHeader
               userName="Mayukh"
               onAvatarPress={handleAvatarPress}
               onCastPress={handleCastPress}
               onSearchPress={handleSearchPress}
               onMenuPress={handleMenuPress}
            />

            {/* Downloads Card - Memoized to prevent re-renders */}
            <MemoizedDownloadsCard onPress={handleDownloadsPress} />

            {/* Stories You have Liked Section */}
            {likedStories.length > 0 && (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Stories You have Liked</Text>
                  <ScrollView
                     horizontal
                     showsHorizontalScrollIndicator={false}
                     contentContainerStyle={styles.horizontalScrollContent}
                  >
                     {likedStories.map((story) => (
                        <MemoizedStoryCard
                           key={story.id}
                           story={story}
                           shareMessage={`Check out "${story.title}" on AudioBook!`}
                           onPress={handleStoryPress}
                        />
                     ))}
                  </ScrollView>
               </View>
            )}

            {/* My List Section - Memoized to prevent re-renders */}
            <MemoizedContentRow
               title="My List"
               items={myListStories}
               showMyListLink={true}
               onItemPress={handleStoryPress}
               onMyListPress={handleMyListSeeAll}
            />

            {/* Previews You Have Listened Section */}
            {listenedPreviews.length > 0 && (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Previews You Have Listened</Text>
                  <ScrollView
                     horizontal
                     showsHorizontalScrollIndicator={false}
                     contentContainerStyle={styles.horizontalScrollContent}
                  >
                     {listenedPreviews.map((preview) => (
                        <MemoizedStoryCard
                           key={preview.id}
                           story={preview}
                           shareMessage={`Listen to "${preview.title}" on AudioBook!`}
                           onPress={handleStoryPress}
                        />
                     ))}
                  </ScrollView>
               </View>
            )}
         </ScrollView>

         {/* Drawer Menu */}
         <DrawerMenu
            visible={drawerVisible}
            onClose={handleCloseDrawer}
            onAppSettingsPress={handleAppSettingsPress}
            onAccountPress={handleAccountPress}
            onHelpPress={handleHelpPress}
            onSignOutPress={handleSignOutPress}
         />
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
   section: {
      marginBottom: spacing.lg,
      backgroundColor: colors.background.dark,
   },
   sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      letterSpacing: -0.2,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
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
   horizontalScrollContent: {
      paddingHorizontal: spacing.md,
   },
});

/**
 * Profile screen wrapper with animation
 * Always transitions from right to left
 */
export default function ProfileScreen() {
   return (
      <AnimatedTabScreen direction="right" currentRoute="profile">
         <ProfileScreenContent />
      </AnimatedTabScreen>
   );
}
