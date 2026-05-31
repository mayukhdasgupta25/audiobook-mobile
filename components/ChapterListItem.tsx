/**
 * Chapter list item — compact row with number, play/download actions
 */

import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chapter } from '@/services/audiobooks';
import { colors, spacing, typography } from '@/theme';
import { formatDuration } from '@/utils/duration';

interface ChapterListItemProps {
   chapter: Chapter;
   onPress: (chapter: Chapter) => void;
   isCurrentlyPlaying?: boolean;
   isActive?: boolean;
   progressSeconds?: number;
   showResumeBadge?: boolean;
   onDownloadPress?: (chapter: Chapter) => void;
   onCommentsPress?: (chapter: Chapter) => void;
}

export const ChapterListItem: React.FC<ChapterListItemProps> = React.memo(
   ({
      chapter,
      onPress,
      isCurrentlyPlaying = false,
      isActive = false,
      onDownloadPress,
   }) => {
      const formattedDuration = formatDuration(chapter.duration);
      const isHighlighted = isActive || isCurrentlyPlaying;

      return (
         <View>
         <TouchableOpacity
            style={[styles.container, isHighlighted && styles.containerActive]}
            onPress={() => onPress(chapter)}
            activeOpacity={0.7}
         >
            {isHighlighted && <View style={styles.activeBar} />}

            <Text style={styles.chapterNumber}>{chapter.chapterNumber}</Text>

            <View style={styles.infoContainer}>
               <Text
                  style={[styles.title, isHighlighted && styles.titleActive]}
                  numberOfLines={1}
               >
                  {chapter.title}
               </Text>
               <Text style={styles.duration}>{formattedDuration}</Text>
            </View>

            <View style={styles.actions}>
               {onDownloadPress && (
                  <TouchableOpacity
                     style={styles.actionButton}
                     onPress={(e) => {
                        e.stopPropagation?.();
                        onDownloadPress(chapter);
                     }}
                     activeOpacity={0.7}
                  >
                     <Ionicons
                        name="download-outline"
                        size={20}
                        color={colors.accent.primary}
                     />
                  </TouchableOpacity>
               )}
               <TouchableOpacity
                  style={styles.playButton}
                  onPress={(e) => {
                     e.stopPropagation?.();
                     onPress(chapter);
                  }}
                  activeOpacity={0.8}
               >
                  <Ionicons
                     name={isCurrentlyPlaying ? 'pause' : 'play'}
                     size={14}
                     color="#FFFFFF"
                     style={!isCurrentlyPlaying ? styles.playIconOffset : undefined}
                  />
               </TouchableOpacity>
            </View>
         </TouchableOpacity>
         <View style={styles.divider} />
         </View>
      );
   }
);

ChapterListItem.displayName = 'ChapterListItem';

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      paddingLeft: spacing.md + 4,
      backgroundColor: colors.background.screen,
      position: 'relative',
   },
   containerActive: {
      backgroundColor: colors.background.highlight,
   },
   divider: {
      height: 1,
      backgroundColor: colors.background.highlight,
      marginLeft: spacing.md,
   },
   activeBar: {
      position: 'absolute',
      left: 0,
      top: spacing.sm,
      bottom: spacing.sm,
      width: 3,
      backgroundColor: colors.accent.primary,
      borderRadius: 2,
   },
   chapterNumber: {
      width: 28,
      fontSize: typography.fontSize.sm,
      fontWeight: '600',
      color: colors.text.muted,
      textAlign: 'center',
      marginRight: spacing.sm,
   },
   infoContainer: {
      flex: 1,
      marginRight: spacing.sm,
   },
   title: {
      fontSize: typography.fontSize.base,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: 2,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   titleActive: {
      fontWeight: '600',
      color: colors.accent.primaryDark,
   },
   duration: {
      fontSize: typography.fontSize.xs,
      color: colors.text.secondary,
   },
   actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
   },
   actionButton: {
      padding: spacing.xs,
   },
   playButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
   },
   playIconOffset: {
      marginLeft: 2,
   },
});
