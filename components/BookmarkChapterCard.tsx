import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Bookmark } from '@/services/bookmarks';
import { apiConfig } from '@/services/api';
import { colors, spacing, typography, borderRadius } from '@/theme';
import {
   getBookmarkAudiobookId,
   getBookmarkChapterTitle,
   getBookmarkAudiobookTitle,
   getBookmarkCoverPath,
   getBookmarkChapterLabel,
} from '@/utils/bookmarkDisplay';

interface BookmarkChapterCardProps {
   bookmark: Bookmark;
   onPress?: () => void;
   /** Full-width row for list screens */
   variant?: 'card' | 'row';
}

export const BOOKMARK_CARD_WIDTH = 160;

export const BookmarkChapterCard: React.FC<BookmarkChapterCardProps> = ({
   bookmark,
   onPress,
   variant = 'card',
}) => {
   const audiobookId = getBookmarkAudiobookId(bookmark);
   const coverPath = getBookmarkCoverPath(bookmark);
   const coverUri = coverPath ? `${apiConfig.baseURL}${coverPath}` : undefined;
   const chapterTitle = getBookmarkChapterTitle(bookmark);
   const audiobookTitle = getBookmarkAudiobookTitle(bookmark);
   const chapterLabel = getBookmarkChapterLabel(bookmark);
   const canPress = Boolean(audiobookId && onPress);

   const content = (
      <>
         {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
         ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
               <Ionicons name="bookmark" size={24} color={colors.accent.primary} />
            </View>
         )}
         <View style={styles.textBlock}>
            {chapterLabel && <Text style={styles.chapterLabel}>{chapterLabel}</Text>}
            <Text style={styles.chapterTitle} numberOfLines={2}>
               {chapterTitle}
            </Text>
            {audiobookTitle ? (
               <Text style={styles.audiobookTitle} numberOfLines={1}>
                  {audiobookTitle}
               </Text>
            ) : null}
         </View>
      </>
   );

   if (variant === 'row') {
      return (
         <TouchableOpacity
            style={[styles.rowCard, !canPress && styles.disabled]}
            onPress={canPress ? onPress : undefined}
            activeOpacity={canPress ? 0.85 : 1}
            disabled={!canPress}
         >
            {coverUri ? (
               <Image
                  source={{ uri: coverUri }}
                  style={styles.rowCover}
                  contentFit="cover"
               />
            ) : (
               <View style={[styles.rowCover, styles.coverPlaceholder]}>
                  <Ionicons name="bookmark" size={20} color={colors.accent.primary} />
               </View>
            )}
            <View style={styles.rowTextBlock}>
               {chapterLabel && <Text style={styles.chapterLabel}>{chapterLabel}</Text>}
               <Text style={styles.chapterTitle} numberOfLines={2}>
                  {chapterTitle}
               </Text>
               {audiobookTitle ? (
                  <Text style={styles.audiobookTitle} numberOfLines={1}>
                     {audiobookTitle}
                  </Text>
               ) : null}
            </View>
         </TouchableOpacity>
      );
   }

   return (
      <TouchableOpacity
         style={[styles.card, !canPress && styles.disabled]}
         onPress={canPress ? onPress : undefined}
         activeOpacity={canPress ? 0.85 : 1}
         disabled={!canPress}
      >
         {content}
      </TouchableOpacity>
   );
};

const styles = StyleSheet.create({
   card: {
      width: BOOKMARK_CARD_WIDTH,
      marginRight: spacing.sm,
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: 'hidden',
   },
   rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.background.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
   },
   rowCover: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.md,
   },
   rowTextBlock: {
      flex: 1,
      marginLeft: spacing.md,
   },
   disabled: {
      opacity: 0.7,
   },
   cover: {
      width: '100%',
      height: 88,
   },
   coverPlaceholder: {
      backgroundColor: colors.background.input,
      alignItems: 'center',
      justifyContent: 'center',
   },
   textBlock: {
      padding: spacing.sm,
      flex: 1,
   },
   chapterLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.accent.primary,
      fontWeight: '600',
      marginBottom: 2,
   },
   chapterTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: '600',
      color: colors.text.primary,
      ...Platform.select({
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   audiobookTitle: {
      fontSize: typography.fontSize.xs,
      color: colors.text.secondary,
      marginTop: 2,
   },
});
