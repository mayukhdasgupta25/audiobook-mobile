import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Bookmark } from '@/services/bookmarks';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
   getBookmarkAudiobookId,
   getBookmarkChapterTitle,
   getBookmarkAudiobookTitle,
   getBookmarkCoverUri,
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
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         card: {
            width: BOOKMARK_CARD_WIDTH,
            marginRight: spacing.sm,
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
         },
         rowCard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            backgroundColor: t.colors.background.card,
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
         rowDivider: {
            height: 1,
            backgroundColor: t.colors.background.highlight,
         },
         disabled: {
            opacity: 0.7,
         },
         cover: {
            width: '100%',
            height: 88,
         },
         coverPlaceholder: {
            backgroundColor: t.colors.background.input,
            alignItems: 'center',
            justifyContent: 'center',
         },
         textBlock: {
            padding: spacing.sm,
            flex: 1,
         },
         chapterLabel: {
            fontSize: typography.fontSize.xs,
            color: t.colors.accent.primary,
            fontWeight: '600',
            marginBottom: 2,
         },
         chapterTitle: {
            fontSize: typography.fontSize.sm,
            fontWeight: '600',
            color: t.colors.text.primary,
            ...Platform.select({
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         audiobookTitle: {
            fontSize: typography.fontSize.xs,
            color: t.colors.text.secondary,
            marginTop: 2,
         },
      })
   );

   const audiobookId = getBookmarkAudiobookId(bookmark);
   const coverUri = getBookmarkCoverUri(bookmark);
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
         <View>
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
         <View style={styles.rowDivider} />
         </View>
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
