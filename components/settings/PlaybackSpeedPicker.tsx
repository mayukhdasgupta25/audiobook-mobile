import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { spacing, typography, borderRadius } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { RootState } from '@/store';
import {
   PLAYBACK_SPEED_OPTIONS,
   formatPlaybackSpeedLabel,
   type PlaybackSpeed,
} from '@/constants/playbackSpeed';
import { applyPlaybackSpeed } from '@/utils/applyPlaybackSpeed';

interface PlaybackSpeedPickerProps {
   hint?: string;
}

export const PlaybackSpeedPicker: React.FC<PlaybackSpeedPickerProps> = ({
   hint = 'Default speed for audiobook playback. You can also change speed while listening.',
}) => {
   const playbackSpeed = useSelector((state: RootState) => state.settings.playbackSpeed);

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         content: {
            padding: spacing.md,
         },
         hint: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginBottom: spacing.md,
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
         },
         row: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
         },
         option: {
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.lg,
            borderWidth: 2,
            borderColor: t.colors.border.medium,
            backgroundColor: 'transparent',
            minWidth: 56,
            alignItems: 'center',
         },
         optionSelected: {
            borderColor: t.colors.accent.primary,
            backgroundColor: t.colors.background.highlight,
         },
         optionText: {
            fontSize: typography.fontSize.base,
            color: t.colors.text.secondary,
            fontWeight: '600',
         },
         optionTextSelected: {
            color: t.colors.accent.primary,
         },
      })
   );

   const handleSelect = useCallback((speed: PlaybackSpeed) => {
      void applyPlaybackSpeed(speed);
   }, []);

   return (
      <View style={styles.content}>
         <Text style={styles.hint}>{hint}</Text>
         <View style={styles.row}>
            {PLAYBACK_SPEED_OPTIONS.map((speed) => {
               const isSelected = playbackSpeed === speed;
               return (
                  <TouchableOpacity
                     key={speed}
                     style={[styles.option, isSelected && styles.optionSelected]}
                     onPress={() => handleSelect(speed)}
                     activeOpacity={0.7}
                  >
                     <Text
                        style={[
                           styles.optionText,
                           isSelected && styles.optionTextSelected,
                        ]}
                     >
                        {formatPlaybackSpeedLabel(speed)}
                     </Text>
                  </TouchableOpacity>
               );
            })}
         </View>
      </View>
   );
};
