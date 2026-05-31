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
import { Audiobook } from '@/services/audiobooks';
import { apiConfig } from '@/services/api';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { formatDuration } from '@/utils/duration';

interface MoodAudiobookRowProps {
   audiobook: Audiobook;
   onPress: () => void;
   onPlayPress: () => void;
}

export const MoodAudiobookRow: React.FC<MoodAudiobookRowProps> = ({
   audiobook,
   onPress,
   onPlayPress,
}) => {
   const coverPath = audiobook.contentCardCoverImage || audiobook.coverImage;
   const coverUri = coverPath ? `${apiConfig.baseURL}${coverPath}` : undefined;
   const author = audiobook.author || audiobook.narrators?.[0] || 'Unknown author';
   const durationLabel = audiobook.duration ? formatDuration(audiobook.duration) : '';

   return (
      <TouchableOpacity
         style={styles.row}
         onPress={onPress}
         activeOpacity={0.85}
      >
         {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
         ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
               <Text style={styles.coverLetter}>{audiobook.title.charAt(0)}</Text>
            </View>
         )}

         <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
               {audiobook.title}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
               {author}
            </Text>
            {durationLabel ? (
               <Text style={styles.meta}>{durationLabel}</Text>
            ) : null}
         </View>

         <TouchableOpacity
            style={styles.playButton}
            onPress={(event) => {
               event.stopPropagation?.();
               onPlayPress();
            }}
            activeOpacity={0.8}
         >
            <Ionicons name="play" size={18} color={colors.background.screen} />
         </TouchableOpacity>
      </TouchableOpacity>
   );
};

const styles = StyleSheet.create({
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
   },
   cover: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.md,
      marginRight: spacing.md,
   },
   coverPlaceholder: {
      backgroundColor: colors.background.input,
      justifyContent: 'center',
      alignItems: 'center',
   },
   coverLetter: {
      fontSize: typography.fontSize.xl,
      color: colors.text.secondary,
      fontWeight: '700',
   },
   body: {
      flex: 1,
      marginRight: spacing.sm,
   },
   title: {
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      marginBottom: 2,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   author: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginBottom: 2,
   },
   meta: {
      fontSize: typography.fontSize.xs,
      color: colors.text.muted,
   },
   playButton: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent.primary,
      justifyContent: 'center',
      alignItems: 'center',
   },
});
