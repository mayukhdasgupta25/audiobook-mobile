/**
 * Chapter list item component
 * Displays a chapter with cover image, title, description, and duration
 */

import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Chapter } from '@/services/audiobooks';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { formatDuration } from '@/utils/duration';
import { apiConfig } from '@/services/api';

interface ChapterListItemProps {
   chapter: Chapter;
   onPress: (chapter: Chapter) => void;
   isCurrentlyPlaying?: boolean;
}

/**
 * Chapter list item component
 * Displays a horizontal card with chapter cover, title, description, and duration
 */
export const ChapterListItem: React.FC<ChapterListItemProps> = React.memo(
   ({ chapter, onPress, isCurrentlyPlaying = false }) => {
      // Build full image URL by prepending API base URL
      const imageUri = chapter.coverImage
         ? `${apiConfig.baseURL}${chapter.coverImage}`
         : undefined;

      const formattedDuration = formatDuration(chapter.duration);

      return (
         <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(chapter)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${chapter.title} - ${formattedDuration}`}
         >
            {/* Now Playing Badge - Top Right of Card */}
            {isCurrentlyPlaying && (
               <View style={styles.nowPlayingBadge}>
                  <Text style={styles.nowPlayingText}>Now Playing</Text>
               </View>
            )}

            {/* Chapter Cover */}
            <View style={styles.imageContainer}>
               {imageUri ? (
                  <Image
                     source={{ uri: imageUri }}
                     style={styles.image}
                     contentFit="cover"
                     transition={200}
                     cachePolicy="memory-disk"
                  />
               ) : (
                  <View style={[styles.image, styles.placeholder]}>
                     <Text style={styles.placeholderText}>
                        {chapter.title.charAt(0)}
                     </Text>
                  </View>
               )}
            </View>

            {/* Chapter Info */}
            <View style={styles.infoContainer}>
               <Text style={styles.title} numberOfLines={2}>
                  {chapter.title}
               </Text>
               {chapter.description ? (
                  <Text style={styles.description} numberOfLines={2}>
                     {chapter.description}
                  </Text>
               ) : null}
               <Text style={styles.duration} numberOfLines={1}>
                  {formattedDuration}
               </Text>
            </View>
         </TouchableOpacity>
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
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: colors.background.dark,
      position: 'relative',
   },
   imageContainer: {
      marginRight: spacing.md,
   },
   image: {
      width: 80,
      height: 120,
      borderRadius: borderRadius.md,
   },
   nowPlayingBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: colors.app.red,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
      borderRadius: borderRadius.sm,
      zIndex: 10,
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
         },
         android: {
            elevation: 5,
         },
      }),
   },
   nowPlayingText: {
      fontSize: typography.fontSize.xs,
      color: colors.text.dark,
      fontWeight: '600',
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
   placeholder: {
      backgroundColor: colors.background.darkGray,
      justifyContent: 'center',
      alignItems: 'center',
   },
   placeholderText: {
      fontSize: typography.fontSize.xl,
      color: colors.text.secondaryDark,
      fontWeight: '700',
   },
   infoContainer: {
      flex: 1,
      justifyContent: 'center',
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      marginBottom: spacing.xs,
      letterSpacing: -0.2,
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
   description: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      marginBottom: spacing.xs / 2,
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
   duration: {
      fontSize: typography.fontSize.xs,
      color: colors.text.secondaryDark,
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

