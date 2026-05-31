import React from 'react';
import {
   View,
   Text,
   Modal,
   StyleSheet,
   TouchableOpacity,
   Pressable,
   Platform,
} from 'react-native';
import { spacing, typography, borderRadius } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
   PLAYBACK_SPEED_OPTIONS,
   formatPlaybackSpeedLabel,
   type PlaybackSpeed,
} from '@/constants/playbackSpeed';

interface PlaybackSpeedSheetProps {
   visible: boolean;
   currentSpeed: PlaybackSpeed;
   onSelect: (speed: PlaybackSpeed) => void;
   onClose: () => void;
}

export const PlaybackSpeedSheet: React.FC<PlaybackSpeedSheetProps> = ({
   visible,
   currentSpeed,
   onSelect,
   onClose,
}) => {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
         },
         card: {
            backgroundColor: t.colors.background.screen,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xxl,
         },
         title: {
            fontSize: typography.fontSize.lg,
            fontWeight: '600',
            color: t.colors.text.primary,
            marginBottom: spacing.md,
            ...Platform.select({
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         optionsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.lg,
         },
         option: {
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.lg,
            backgroundColor: t.colors.background.input,
            minWidth: 56,
            alignItems: 'center',
         },
         optionSelected: {
            backgroundColor: t.colors.accent.primary,
         },
         optionText: {
            fontSize: typography.fontSize.base,
            fontWeight: '500',
            color: t.colors.text.primary,
         },
         optionTextSelected: {
            color: '#fff',
         },
         doneBtn: {
            alignSelf: 'center',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.xl,
         },
         doneText: {
            fontSize: typography.fontSize.base,
            fontWeight: '600',
            color: t.colors.accent.primary,
         },
      })
   );

   return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
         <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
               <Text style={styles.title}>Playback speed</Text>
               <View style={styles.optionsRow}>
                  {PLAYBACK_SPEED_OPTIONS.map((speed) => {
                     const isSelected = currentSpeed === speed;
                     return (
                        <TouchableOpacity
                           key={speed}
                           style={[
                              styles.option,
                              isSelected && styles.optionSelected,
                           ]}
                           onPress={() => onSelect(speed)}
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
               <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.8}>
                  <Text style={styles.doneText}>Done</Text>
               </TouchableOpacity>
            </Pressable>
         </Pressable>
      </Modal>
   );
};
