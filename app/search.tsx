import React, { useState, useCallback, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
   KeyboardAvoidingView,
   Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '@/components/SearchBar';
import { TrendingChip } from '@/components/TrendingChip';
import { PopularStoryItem, PopularStory } from '@/components/PopularStoryItem';
import { colors, spacing, typography } from '@/theme';
import { RootState } from '@/store';

/**
 * Search screen with search bar, trending searches, and popular stories
 * Full-screen modal page with slide-up animation
 */
export default function SearchScreen() {
   const [searchQuery, setSearchQuery] = useState('');
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

   // Sample data for trending searches
   const trendingSearches = [
      'Mystery',
      'Thriller',
      'Romance',
      'Fantasy',
      'Self-Help',
      'Biography',
      'Horror',
      'Sci-Fi',
   ];

   // Sample data for popular stories
   const popularStories: PopularStory[] = [
      {
         id: '1',
         title: 'The Midnight Library',
         author: 'Matt Haig',
         category: 'Fiction',
      },
      {
         id: '2',
         title: 'Atomic Habits',
         author: 'James Clear',
         category: 'Self-Help',
      },
      {
         id: '3',
         title: 'The Silent Patient',
         author: 'Alex Michaelides',
         category: 'Thriller',
      },
      {
         id: '4',
         title: 'Educated',
         author: 'Tara Westover',
         category: 'Biography',
      },
      {
         id: '5',
         title: 'Where the Crawdads Sing',
         author: 'Delia Owens',
         category: 'Fiction',
      },
   ];

   const handleBack = useCallback(() => {
      // Dismiss keyboard first for smoother animation
      Keyboard.dismiss();
      // Small delay to allow keyboard to dismiss before navigation
      setTimeout(() => {
         if (router.canGoBack()) {
            router.back();
         }
      }, 100);
   }, []);

   const handleSearchChange = useCallback((text: string) => {
      setSearchQuery(text);
      // TODO: Implement debounced search API call
   }, []);

   const handleClearSearch = useCallback(() => {
      setSearchQuery('');
   }, []);

   const handleSearchSubmit = useCallback(() => {
      if (searchQuery.trim()) {
         console.log('Searching for:', searchQuery);
         // TODO: Implement actual search
      }
   }, [searchQuery]);

   const handleTrendingPress = useCallback((term: string) => {
      setSearchQuery(term);
      console.log('Trending search:', term);
      // TODO: Implement search with trending term
   }, []);

   const handleStoryPress = useCallback((story: PopularStory) => {
      console.log('Story pressed:', story.title);
      // TODO: Navigate to story details
   }, []);

   return (
      <>
         {/* Configure modal presentation */}
         <Stack.Screen
            options={{
               presentation: 'modal',
               animation: 'slide_from_bottom',
               headerShown: false,
               gestureEnabled: true,
               gestureDirection: 'vertical',
               animationDuration: 300,
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />

         <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
               style={styles.keyboardAvoid}
               behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
               {/* Header with Back Button and Search Bar */}
               <View style={styles.header}>
                  <TouchableOpacity
                     onPress={handleBack}
                     style={styles.backButton}
                     activeOpacity={0.7}
                     accessibilityLabel="Go back"
                     accessibilityRole="button"
                  >
                     <Ionicons
                        name="chevron-back"
                        size={28}
                        color={colors.text.dark}
                     />
                  </TouchableOpacity>

                  <SearchBar
                     value={searchQuery}
                     onChangeText={handleSearchChange}
                     onClear={handleClearSearch}
                     onSubmit={handleSearchSubmit}
                     autoFocus={true}
                  />
               </View>

               {/* Content */}
               <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
               >
                  {searchQuery.trim().length === 0 ? (
                     <>
                        {/* Trending Searches Section */}
                        <View style={styles.section}>
                           <Text style={styles.sectionTitle}>Trending Searches</Text>
                           <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.trendingContainer}
                           >
                              {trendingSearches.map((term) => (
                                 <TrendingChip
                                    key={term}
                                    label={term}
                                    onPress={() => handleTrendingPress(term)}
                                 />
                              ))}
                           </ScrollView>
                        </View>

                        {/* Popular Stories Section */}
                        <View style={styles.section}>
                           <Text style={styles.sectionTitle}>Popular Stories</Text>
                           {popularStories.map((story) => (
                              <PopularStoryItem
                                 key={story.id}
                                 story={story}
                                 onPress={() => handleStoryPress(story)}
                              />
                           ))}
                        </View>
                     </>
                  ) : (
                     // Search Results (placeholder for future implementation)
                     <View style={styles.resultsContainer}>
                        <Text style={styles.resultsText}>
                           Searching for &quot;{searchQuery}&quot;...
                        </Text>
                        <Text style={styles.resultsSubtext}>
                           Search results will appear here
                        </Text>
                     </View>
                  )}
               </ScrollView>
            </KeyboardAvoidingView>
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
   },
   keyboardAvoid: {
      flex: 1,
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: colors.background.dark,
   },
   backButton: {
      marginRight: spacing.sm,
      padding: spacing.xs,
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      paddingBottom: spacing.xl,
   },
   section: {
      marginTop: spacing.lg,
   },
   sectionTitle: {
      fontSize: typography.fontSize.xl,
      fontWeight: '600',
      color: colors.text.dark,
      letterSpacing: -0.3,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
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
   trendingContainer: {
      paddingHorizontal: spacing.md,
   },
   resultsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: spacing.xxl,
      paddingHorizontal: spacing.lg,
   },
   resultsText: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      textAlign: 'center',
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
   resultsSubtext: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      textAlign: 'center',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
});

