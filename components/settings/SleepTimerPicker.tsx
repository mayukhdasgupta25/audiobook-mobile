import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { spacing, typography, borderRadius } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { RootState } from '@/store';
import { startSleepTimer, clearSleepTimer } from '@/store/settings';
import {
   SLEEP_TIMER_CHOICES,
   formatSleepTimerRemaining,
   type SleepTimerOption,
} from '@/constants/sleepTimer';
import { isSleepTimerActive } from '@/utils/sleepTimer';

interface SleepTimerPickerProps {
   hint?: string;
}

export const SleepTimerPicker: React.FC<SleepTimerPickerProps> = ({
   hint = 'Playback stops when the timer ends or at the end of the current chapter.',
}) => {
   const dispatch = useDispatch();
   const sleepTimerOption = useSelector((state: RootState) => state.settings.sleepTimerOption);
   const sleepTimerEndsAt = useSelector((state: RootState) => state.settings.sleepTimerEndsAt);
   const settings = useSelector((state: RootState) => state.settings);

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         content: {
            padding: spacing.md,
         },
         hint: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginBottom: spacing.sm,
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
         },
         status: {
            fontSize: typography.fontSize.sm,
            color: t.colors.accent.primary,
            fontWeight: '600',
            marginBottom: spacing.md,
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
            alignItems: 'center',
         },
         optionSelected: {
            borderColor: t.colors.accent.primary,
            backgroundColor: t.colors.background.highlight,
         },
         optionText: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            fontWeight: '600',
         },
         optionTextSelected: {
            color: t.colors.accent.primary,
         },
         cancelBtn: {
            marginTop: spacing.md,
            alignSelf: 'flex-start',
         },
         cancelText: {
            fontSize: typography.fontSize.sm,
            fontWeight: '600',
            color: t.colors.error,
         },
      })
   );

   const handleSelect = useCallback(
      (option: SleepTimerOption) => {
         if (option === 'off') {
            dispatch(clearSleepTimer());
            return;
         }
         dispatch(startSleepTimer(option));
      },
      [dispatch]
   );

   const timerActive = isSleepTimerActive(settings);
   const statusText =
      sleepTimerOption === 'endOfChapter' && timerActive
         ? 'Stops at end of chapter'
         : sleepTimerEndsAt && timerActive
           ? `Stops in ${formatSleepTimerRemaining(sleepTimerEndsAt)}`
           : null;

   return (
      <View style={styles.content}>
         <Text style={styles.hint}>{hint}</Text>
         {statusText ? <Text style={styles.status}>{statusText}</Text> : null}
         <View style={styles.row}>
            {SLEEP_TIMER_CHOICES.map((choice) => {
               const selected =
                  choice.value === 'off'
                     ? sleepTimerOption === 'off' || !timerActive
                     : sleepTimerOption === choice.value && timerActive;
               return (
                  <TouchableOpacity
                     key={choice.value}
                     style={[styles.option, selected && styles.optionSelected]}
                     onPress={() => handleSelect(choice.value)}
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
         {timerActive ? (
            <TouchableOpacity
               style={styles.cancelBtn}
               onPress={() => dispatch(clearSleepTimer())}
               activeOpacity={0.7}
            >
               <Text style={styles.cancelText}>Cancel timer</Text>
            </TouchableOpacity>
         ) : null}
      </View>
   );
};
