import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
   runOnJS,
   useAnimatedReaction,
   useAnimatedStyle,
   useSharedValue,
} from 'react-native-reanimated';
import {
   getMaxSeekableProgress,
   progressToSeekSeconds,
} from '@/utils/playbackPosition';
import { formatDuration } from '@/utils/duration';
import { colors, spacing, typography, borderRadius } from '@/theme';

const PROGRESS_BAR_HEIGHT = 5;
const PROGRESS_HANDLE_SIZE = 20;
const PROGRESS_HANDLE_CENTER_OFFSET = PROGRESS_HANDLE_SIZE / 2;
const PROGRESS_HANDLE_TOP = -(PROGRESS_HANDLE_CENTER_OFFSET - PROGRESS_BAR_HEIGHT / 2);
const PROGRESS_TOUCH_MIN_HEIGHT = 52;
const PROGRESS_BAR_HORIZONTAL_PADDING = 10;
const TIME_TEXT_SIZE = typography.fontSize.base;

function touchXToProgress(touchX: number, barWidth: number, maxProgress: number): number {
   'worklet';
   if (barWidth <= 0) {
      return 0;
   }
   const raw = Math.max(0, Math.min(1, touchX / barWidth));
   return Math.max(0, Math.min(maxProgress, raw));
}

export interface AudioPlayerSeekBarProps {
   duration: number;
   position: number;
   disabled?: boolean;
   onSeekStart: () => void;
   onSeekEnd: () => void;
   onSeekComplete: (seconds: number) => void;
}

export const AudioPlayerSeekBar: React.FC<AudioPlayerSeekBarProps> = ({
   duration,
   position,
   disabled = false,
   onSeekStart,
   onSeekEnd,
   onSeekComplete,
}) => {
   const [displayedTime, setDisplayedTime] = useState(0);

   const onSeekStartRef = useRef(onSeekStart);
   const onSeekEndRef = useRef(onSeekEnd);
   const onSeekCompleteRef = useRef(onSeekComplete);
   onSeekStartRef.current = onSeekStart;
   onSeekEndRef.current = onSeekEnd;
   onSeekCompleteRef.current = onSeekComplete;

   const isScrubbingRef = useRef(false);

   const barWidthShared = useSharedValue(0);
   const durationShared = useSharedValue(duration);
   const maxProgressShared = useSharedValue(getMaxSeekableProgress(duration));
   const dragProgress = useSharedValue(0);
   const actualProgress = useSharedValue(0);
   const isScrubbing = useSharedValue(false);
   const lastDisplayedSecond = useSharedValue(-1);

   useEffect(() => {
      durationShared.value = duration;
      maxProgressShared.value = getMaxSeekableProgress(duration);
   }, [duration, durationShared, maxProgressShared]);

   useEffect(() => {
      if (isScrubbingRef.current || duration <= 0) {
         return;
      }
      actualProgress.value = position / duration;
   }, [position, duration, actualProgress]);

   const handleSeekStart = useCallback(() => {
      isScrubbingRef.current = true;
      onSeekStartRef.current();
   }, []);

   const handleSeekComplete = useCallback((progress: number, durationSeconds: number) => {
      const seconds = progressToSeekSeconds(progress, durationSeconds);
      onSeekCompleteRef.current(seconds);
      onSeekEndRef.current();
      isScrubbingRef.current = false;
   }, []);

   const handleSeekCancel = useCallback(() => {
      onSeekEndRef.current();
      isScrubbingRef.current = false;
      setDisplayedTime(0);
      lastDisplayedSecond.value = -1;
   }, [lastDisplayedSecond]);

   const updateDisplayedTime = useCallback((time: number) => {
      setDisplayedTime(time);
   }, []);

   const clearDisplayedTime = useCallback(() => {
      setDisplayedTime(0);
      lastDisplayedSecond.value = -1;
   }, [lastDisplayedSecond]);

   const panGesture = Gesture.Pan()
      .enabled(!disabled && duration > 0)
      .activeOffsetX([-4, 4])
      .failOffsetY([-16, 16])
      .hitSlop({ top: 16, bottom: 16, left: 0, right: 0 })
      .onBegin((event) => {
         isScrubbing.value = true;
         dragProgress.value = touchXToProgress(
            event.x,
            barWidthShared.value,
            maxProgressShared.value
         );
         runOnJS(handleSeekStart)();
      })
      .onUpdate((event) => {
         dragProgress.value = touchXToProgress(
            event.x,
            barWidthShared.value,
            maxProgressShared.value
         );
      })
      .onEnd((event) => {
         const progress = touchXToProgress(
            event.x,
            barWidthShared.value,
            maxProgressShared.value
         );
         dragProgress.value = progress;
         actualProgress.value = progress;
         isScrubbing.value = false;
         runOnJS(handleSeekComplete)(progress, durationShared.value);
      })
      .onFinalize((_event, success) => {
         if (success) {
            return;
         }
         isScrubbing.value = false;
         runOnJS(handleSeekCancel)();
      });

   const progressFillStyle = useAnimatedStyle(() => {
      const progress = isScrubbing.value ? dragProgress.value : actualProgress.value;
      const width = barWidthShared.value;
      return {
         width: width > 0 ? progress * width : 0,
      };
   });

   const progressHandleStyle = useAnimatedStyle(() => {
      const progress = isScrubbing.value ? dragProgress.value : actualProgress.value;
      const width = barWidthShared.value;
      return {
         left:
            width > 0
               ? progress * width - PROGRESS_HANDLE_CENTER_OFFSET
               : -PROGRESS_HANDLE_CENTER_OFFSET,
      };
   });

   useAnimatedReaction(
      () => {
         if (!isScrubbing.value || durationShared.value <= 0) {
            return -1;
         }
         return Math.floor(dragProgress.value * durationShared.value);
      },
      (second) => {
         if (second < 0) {
            return;
         }
         if (second !== lastDisplayedSecond.value) {
            lastDisplayedSecond.value = second;
            runOnJS(updateDisplayedTime)(second);
         }
      }
   );

   useAnimatedReaction(
      () => isScrubbing.value,
      (scrubbing, wasScrubbing) => {
         if (wasScrubbing && !scrubbing) {
            runOnJS(clearDisplayedTime)();
         }
      }
   );

   const elapsedTime = Math.floor(position);
   const totalTime = Math.floor(duration);
   const previewTime = displayedTime > 0 ? displayedTime : elapsedTime;
   const remainingTime = Math.max(0, totalTime - previewTime);

   return (
      <View style={styles.progressContainer}>
         <View style={styles.progressBarWrapper}>
            <GestureDetector gesture={panGesture}>
               <View
                  style={styles.progressBarContainer}
                  onLayout={(event) => {
                     const width = event.nativeEvent.layout.width;
                     if (width > 0) {
                        barWidthShared.value = width;
                     }
                  }}
               >
                  <View style={styles.progressBarTrack}>
                     <View style={styles.progressBar}>
                        <Animated.View style={[styles.progressFill, progressFillStyle]} />
                     </View>
                     <Animated.View style={[styles.progressHandle, progressHandleStyle]} />
                  </View>
               </View>
            </GestureDetector>
         </View>
         <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatDuration(previewTime)}</Text>
            <Text style={styles.timeText}>{formatDuration(totalTime)}</Text>
            <Text style={styles.timeText}>-{formatDuration(remainingTime)}</Text>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   progressContainer: {
      marginBottom: spacing.md,
   },
   progressBarWrapper: {
      marginBottom: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: PROGRESS_BAR_HORIZONTAL_PADDING,
   },
   progressBarContainer: {
      position: 'relative',
      width: '100%',
      minHeight: PROGRESS_TOUCH_MIN_HEIGHT,
      justifyContent: 'center',
   },
   progressBarTrack: {
      position: 'relative',
      width: '100%',
      height: PROGRESS_BAR_HEIGHT,
   },
   progressBar: {
      height: PROGRESS_BAR_HEIGHT,
      backgroundColor: colors.border.light,
      borderRadius: borderRadius.sm,
      overflow: 'hidden',
      width: '100%',
   },
   progressFill: {
      height: '100%',
      backgroundColor: colors.accent.primary,
   },
   progressHandle: {
      position: 'absolute',
      width: PROGRESS_HANDLE_SIZE,
      height: PROGRESS_HANDLE_SIZE,
      borderRadius: PROGRESS_HANDLE_SIZE / 2,
      backgroundColor: colors.accent.primary,
      borderWidth: 2,
      borderColor: colors.background.screen,
      top: PROGRESS_HANDLE_TOP,
      ...Platform.select({
         ios: {
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
         },
         android: {
            elevation: 5,
         },
      }),
   },
   timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: PROGRESS_BAR_HORIZONTAL_PADDING,
   },
   timeText: {
      fontSize: TIME_TEXT_SIZE,
      color: colors.text.secondaryDark,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '400' },
         android: { fontFamily: 'sans-serif' },
      }),
   },
});
