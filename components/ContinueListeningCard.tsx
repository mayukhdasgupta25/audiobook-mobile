import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { formatDuration } from '@/utils/duration';

export interface ContinueListeningCardProps {
   title: string;
   author: string;
   coverUri?: string;
   chapterTitle?: string;
   chapterNumber?: number;
   progress: number;
   elapsedSeconds?: number;
   totalSeconds?: number;
   onPress: () => void;
   onPlayPress: () => void;
}

export const ContinueListeningCard: React.FC<ContinueListeningCardProps> = ({
   title,
   author,
   coverUri,
   chapterTitle,
   chapterNumber,
   progress,
   elapsedSeconds = 0,
   totalSeconds = 0,
   onPress,
   onPlayPress,
}) => {
   const progressPercent = Math.min(100, Math.max(0, progress * 100));
   const chapterMeta =
      chapterNumber && chapterTitle
         ? `Ch. ${chapterNumber} · ${chapterTitle}`
         : chapterTitle ?? '';

   return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
         <View style={styles.coverWrap}>
            {coverUri ? (
               <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
            ) : (
               <View style={[styles.cover, styles.coverPlaceholder]}>
                  <Text style={styles.coverLetter}>{title.charAt(0)}</Text>
               </View>
            )}
         </View>

         <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
               {title}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
               {author}
            </Text>

            <View style={styles.progressTrack}>
               <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.metaRow}>
               <Text style={styles.chapterMeta} numberOfLines={1}>
                  {chapterMeta}
               </Text>
               {totalSeconds > 0 && (
                  <Text style={styles.timeMeta}>
                     {formatDuration(elapsedSeconds)} / {formatDuration(totalSeconds)}
                  </Text>
               )}
            </View>
         </View>

         <TouchableOpacity
            style={styles.playButton}
            onPress={(e) => {
               e.stopPropagation?.();
               onPlayPress();
            }}
            activeOpacity={0.8}
         >
            <Ionicons name="play" size={22} color="#FFFFFF" style={styles.playIcon} />
         </TouchableOpacity>
      </TouchableOpacity>
   );
};

const styles = StyleSheet.create({
   card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      ...shadows.sm,
   },
   coverWrap: {
      marginRight: spacing.md,
   },
   cover: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.md,
   },
   coverPlaceholder: {
      backgroundColor: colors.background.highlight,
      alignItems: 'center',
      justifyContent: 'center',
   },
   coverLetter: {
      fontSize: typography.fontSize.xl,
      fontWeight: '700',
      color: colors.accent.primary,
   },
   content: {
      flex: 1,
      marginRight: spacing.sm,
   },
   title: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   author: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: 2,
      marginBottom: spacing.sm,
   },
   progressTrack: {
      height: 4,
      backgroundColor: colors.background.input,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: spacing.xs,
   },
   progressFill: {
      height: '100%',
      backgroundColor: colors.accent.primary,
      borderRadius: 2,
   },
   metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   chapterMeta: {
      flex: 1,
      fontSize: typography.fontSize.xs,
      color: colors.text.secondary,
      marginRight: spacing.sm,
   },
   timeMeta: {
      fontSize: typography.fontSize.xs,
      color: colors.text.muted,
   },
   playButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
   },
   playIcon: {
      marginLeft: 3,
   },
});
