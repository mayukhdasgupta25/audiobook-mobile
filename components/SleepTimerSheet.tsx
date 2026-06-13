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
   SLEEP_TIMER_CHOICES,
   type SleepTimerOption,
} from '@/constants/sleepTimer';

interface SleepTimerSheetProps {
   visible: boolean;
   currentOption: SleepTimerOption;
   timerActive: boolean;
   onSelect: (option: SleepTimerOption) => void;
   onClose: () => void;
}

export const SleepTimerSheet: React.FC<SleepTimerSheetProps> = ({
   visible,
   currentOption,
   timerActive,
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
            minWidth: 72,
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
               <Text style={styles.title}>Sleep timer</Text>
               <View style={styles.optionsRow}>
                  {SLEEP_TIMER_CHOICES.map((choice) => {
                     const selected =
                        choice.value === 'off'
                           ? currentOption === 'off' || !timerActive
                           : currentOption === choice.value && timerActive;
                     return (
                        <TouchableOpacity
                           key={choice.value}
                           style={[styles.option, selected && styles.optionSelected]}
                           onPress={() => onSelect(choice.value)}
                           activeOpacity={0.7}
                        >
                           <Text
                              style={[
                                 styles.optionText,
                                 selected && styles.optionTextSelected,
                              ]}
                           >
                              {choice.label}
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
