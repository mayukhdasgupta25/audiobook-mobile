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
import type { Audiobook } from '@/services/audiobooks';
import { resolveAudiobookImageUrl } from '@/utils/imageAssets';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatDuration } from '@/utils/duration';

interface AudiobookLibraryRowProps {
   audiobook: Audiobook;
   subtitle?: string;
   onPress: () => void;
   trailing?: React.ReactNode;
}

export function AudiobookLibraryRow({
   audiobook,
   subtitle,
   onPress,
   trailing,
}: AudiobookLibraryRowProps) {
   const { colors } = useTheme();
   const coverUri = resolveAudiobookImageUrl(audiobook, 'listRow');
   const author = audiobook.author || audiobook.narrators?.[0] || 'Unknown author';
   const durationLabel = audiobook.duration ? formatDuration(audiobook.duration) : undefined;

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         row: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            minHeight: 72,
         },
         cover: {
            width: 56,
            height: 56,
            borderRadius: borderRadius.md,
            marginRight: spacing.md,
         },
         coverPlaceholder: {
            backgroundColor: t.colors.background.input,
            justifyContent: 'center',
            alignItems: 'center',
         },
         coverLetter: {
            fontSize: typography.fontSize.xl,
            color: t.colors.text.secondary,
            fontWeight: '700',
         },
         body: {
            flex: 1,
            marginRight: spacing.sm,
         },
         title: {
            fontSize: typography.fontSize.base,
            color: t.colors.text.primary,
            marginBottom: 2,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         subtitle: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginBottom: 2,
         },
         meta: {
            fontSize: typography.fontSize.xs,
            color: t.colors.text.muted,
         },
         chevron: {
            marginLeft: spacing.xs,
         },
      })
   );

   return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
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
            {subtitle ? (
               <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
               </Text>
            ) : (
               <Text style={styles.subtitle} numberOfLines={1}>
                  {author}
               </Text>
            )}
            {durationLabel && !subtitle ? (
               <Text style={styles.meta}>{durationLabel}</Text>
            ) : null}
         </View>

         {trailing ?? (
            <Ionicons
               name="chevron-forward"
               size={20}
               color={colors.text.secondaryDark}
               style={styles.chevron}
            />
         )}
      </TouchableOpacity>
   );
}
