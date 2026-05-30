import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Playlist } from '@/services/playlists';

interface PlaylistCardProps {
   playlist: Playlist;
   onPress?: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onPress }) => {
   return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
         <View style={styles.iconWrap}>
            <Ionicons name="musical-notes" size={28} color={colors.accent.primary} />
         </View>
         <Text style={styles.name} numberOfLines={2}>
            {playlist.name}
         </Text>
         {playlist.description ? (
            <Text style={styles.desc} numberOfLines={2}>
               {playlist.description}
            </Text>
         ) : null}
      </TouchableOpacity>
   );
};

const CARD_WIDTH = 160;

export const PLAYLIST_CARD_WIDTH = CARD_WIDTH;

const styles = StyleSheet.create({
   card: {
      width: CARD_WIDTH,
      marginRight: spacing.sm,
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
   },
   iconWrap: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.input,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
   },
   name: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.primary,
      ...Platform.select({
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   desc: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.xs,
   },
});
