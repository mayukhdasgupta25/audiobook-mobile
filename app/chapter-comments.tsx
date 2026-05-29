import React, { useState, useCallback, useMemo } from 'react';
import {
   View,
   Text,
   StyleSheet,
   Platform,
   TouchableOpacity,
   KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TabUnderline } from '@/components/TabUnderline';
import { CommentInputBar } from '@/components/CommentInputBar';
import { colors, spacing, typography } from '@/theme';
import { setMinimized, setUiSuppressed } from '@/store/player';
import { getTabBarFloatBottom } from '@/theme/tabLayout';

/** Approximate height of the floating input pill (excluding safe-area padding) */
const FLOATING_INPUT_HEIGHT = 56;

type CommentTab = 'comments' | 'highlights' | 'notes';

const TABS = [
   { key: 'comments', label: 'Comments', count: 0 },
   { key: 'highlights', label: 'Highlights', count: 0 },
   { key: 'notes', label: 'Notes', count: 0 },
];

export default function ChapterCommentsScreen() {
   const dispatch = useDispatch();
   const insets = useSafeAreaInsets();
   const params = useLocalSearchParams<{
      audiobookId?: string;
      chapterId?: string;
      chapterTitle?: string;
      chapterNumber?: string;
   }>();

   const [activeTab, setActiveTab] = useState<CommentTab>('comments');

   // Hide player while on comments; restore minimized bar when leaving
   useFocusEffect(
      useCallback(() => {
         dispatch(setUiSuppressed(true));
         dispatch(setMinimized(true));
         return () => {
            dispatch(setUiSuppressed(false));
            dispatch(setMinimized(true));
         };
      }, [dispatch])
   );

   const chapterTitle = params.chapterTitle ?? 'Chapter';
   const chapterNumber = params.chapterNumber;
   const subtitle = chapterNumber ? `Chapter ${chapterNumber}` : undefined;

   const emptyMessage = useCallback(() => {
      switch (activeTab) {
         case 'highlights':
            return 'No highlights yet';
         case 'notes':
            return 'No notes yet';
         default:
            return 'No comments yet';
      }
   }, [activeTab]);

   const inputPlaceholder = useMemo(() => {
      switch (activeTab) {
         case 'highlights':
            return 'Add a highlight...';
         case 'notes':
            return 'Write a note...';
         default:
            return 'Share your thoughts...';
      }
   }, [activeTab]);

   /** Space for floating input + safe area */
   const contentBottomInset =
      FLOATING_INPUT_HEIGHT + getTabBarFloatBottom() + spacing.md + insets.bottom;

   return (
      <KeyboardAvoidingView
         style={styles.flex}
         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <SafeAreaView style={styles.container} edges={['top']}>
         <ScreenHeader
            title={chapterTitle}
            subtitle={subtitle}
            onBack={() => router.back()}
            rightActions={
               <>
                  <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
                     <Ionicons name="bookmark-outline" size={22} color={colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
                     <Ionicons name="ellipsis-horizontal" size={22} color={colors.text.primary} />
                  </TouchableOpacity>
               </>
            }
         />

         <TabUnderline
            tabs={TABS}
            activeKey={activeTab}
            onTabPress={(key) => setActiveTab(key as CommentTab)}
         />

         <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
               <Text style={styles.filterText}>Top</Text>
               <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterIcon} activeOpacity={0.7}>
               <Ionicons name="filter-outline" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
         </View>

         <View style={[styles.emptyState, { paddingBottom: contentBottomInset }]}>
            <Ionicons
               name={
                  activeTab === 'comments'
                     ? 'chatbubble-outline'
                     : activeTab === 'highlights'
                       ? 'color-wand-outline'
                       : 'document-text-outline'
               }
               size={48}
               color={colors.text.muted}
            />
            <Text style={styles.emptyTitle}>{emptyMessage()}</Text>
            <Text style={styles.emptyHint}>
               Be the first to share your thoughts on this chapter
            </Text>
         </View>

         <CommentInputBar floating placeholder={inputPlaceholder} disabled />
      </SafeAreaView>
      </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
   flex: {
      flex: 1,
   },
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   headerIcon: {
      padding: spacing.xs,
   },
   filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
   },
   filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
   },
   filterText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.primary,
      fontWeight: '500',
   },
   filterIcon: {
      padding: spacing.xs,
   },
   emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
   },
   emptyTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      marginTop: spacing.md,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   emptyHint: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: spacing.sm,
   },
});
