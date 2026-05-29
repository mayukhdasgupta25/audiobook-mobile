/**
 * Audio Player Component
 * Displays audio player UI with playback controls and progress
 */

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
   ActivityIndicator,
   Dimensions,
   PanResponder,
   ScrollView,
} from 'react-native';
import Animated, {
   useAnimatedStyle,
   useSharedValue,
   withTiming,
   withSpring,
   cancelAnimation,
   Easing,
   useAnimatedReaction,
   runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setMinimized, setUiSuppressed, releasePlayback } from '@/store/player';
import { useAudioPlayerControls } from '@/contexts/AudioPlaybackContext';
import { usePlaybackSync } from '@/hooks/usePlaybackSync';
import { syncPlayback, initializePlaybackSession } from '@/services/audiobooks';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import {
   getTabBarHeight,
   getTabBarFloatHorizontal,
   getMinimizedPlayerBottom,
   MINIMIZED_PLAYER_BAR_HEIGHT,
} from '@/theme/tabLayout';
import { formatDuration } from '@/utils/duration';
import { apiConfig } from '@/services/api';
import { PLAYER_BOTTOM_SPRING } from '@/theme/tabAnimation';

/**
 * Audio Player component
 * Shows player UI when a chapter is being played
 */
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Proportional sizing for full player internals (~1.25× compact layout) */
const FP = {
   paddingHorizontal: spacing.lg,
   paddingTop: spacing.md,
   paddingBottom: spacing.lg,
   coverSize: 240,
   headerChevronSize: 34,
   headerMenuIconSize: 28,
   chapterLabelSize: typography.fontSize.base,
   chapterTitleSize: typography.fontSize['2xl'],
   playButtonSize: 72,
   playIconSize: 40,
   chapterSkipIconSize: 34,
   seekIconSize: 30,
   bottomActionIconSize: 28,
   progressBarHeight: 5,
   progressHandleSize: 20,
   progressBarHorizontalPadding: 10,
   progressTouchMinHeight: 52,
   dragHandlerWidth: 48,
   dragHandlerHeight: 5,
   dragHandlerMinHeight: 36,
   headerMarginBottom: spacing.md,
   coverMarginBottom: spacing.md,
   progressMarginBottom: spacing.md,
   secondaryMarginBottom: spacing.sm,
   controlsMarginBottom: spacing.sm,
   bottomActionsPaddingTop: spacing.md,
   secondaryGap: spacing.xl,
   bottomActionTextSize: typography.fontSize.sm,
   seekButtonTextSize: typography.fontSize.sm,
   timeTextSize: typography.fontSize.base,
   secondaryButtonTextSize: typography.fontSize.base,
} as const;

const PROGRESS_BAR_INSET = FP.progressBarHorizontalPadding * 2;
const PROGRESS_HANDLE_CENTER_OFFSET = FP.progressHandleSize / 2;
const PROGRESS_HANDLE_TOP =
   -(PROGRESS_HANDLE_CENTER_OFFSET - FP.progressBarHeight / 2);

/** Minimized bar — horizontal layout above tab bar or screen bottom */
const MINIMIZED_BAR = {
   height: MINIMIZED_PLAYER_BAR_HEIGHT,
   coverSize: 56,
   playIconSize: 28,
} as const;

export const AudioPlayer: React.FC = React.memo(() => {
   const dispatch = useDispatch();
   const insets = useSafeAreaInsets();
   const segments = useSegments();
   const hasBottomTabBar = segments[0] === '(tabs)';
   const {
      isPlaying,
      currentChapterId,
      playbackPosition,
      totalDuration,
      isLoading,
      error,
      isVisible,
      isMinimized,
      isUiSuppressed,
      chapterMetadata,
      audiobookId,
   } = useSelector((state: RootState) => state.player);

   const skipDurationSeconds = useSelector(
      (state: RootState) => state.settings.skipDurationSeconds
   );

   // Get user from Redux for session initialization
   const user = useSelector((state: RootState) => state.auth.user);

   // Animation shared values
   const translateY = useSharedValue(SCREEN_HEIGHT);
   const opacity = useSharedValue(0);
   const fullPlayerOpacity = useSharedValue(0);
   const minimizedOpacity = useSharedValue(0);
   const containerBottom = useSharedValue(0);
   const isMountedRef = useRef(false);
   const hasInitializedBottomRef = useRef(false);
   const previousVisibleRef = useRef(false);
   const previousMinimizedRef = useRef(false);

   // Drag-to-minimize shared values and refs
   const dragY = useSharedValue(0);
   const isDraggingDown = useRef(false);
   const dragStartY = useRef(0);
   const isMinimizedRef = useRef(isMinimized);
   const progressBarWidthRef = useRef(0);
   const progressBarWrapperRef = useRef<View | null>(null);
   const wrapperXRef = useRef(0);
   const wrapperYRef = useRef(0);
   const wrapperWidthRef = useRef(0);
   const wrapperHeightRef = useRef(0);

   // Shared values for dragging animation (no useState to avoid re-renders)
   const dragProgressValue = useSharedValue(0);
   const isDraggingValue = useSharedValue(false);
   // State for displayed time during drag (updated via runOnJS)
   const [displayedTime, setDisplayedTime] = useState(0);

   // Use audio player hook
   const {
      handleSeek,
      seekToTime,
      playPlayback,
      pausePlayback,
      skipToNextChapter,
      skipToPreviousChapter,
      setDragging,
      resetPlayer,
   } = useAudioPlayerControls();

   // Use playback sync hook to automatically sync every 5 seconds during playback
   // Only sync when player is visible (active)
   usePlaybackSync({
      audiobookId,
      chapterId: currentChapterId,
      playbackPosition,
      isPlaying,
      isActive: isVisible, // Only sync when player is visible/active
   });

   // Shared value for actual playback progress (updated from Redux state)
   const actualProgressValue = useSharedValue(0);

   // Store totalDuration in ref so PanResponder can access current value
   const totalDurationRef = useRef(totalDuration);
   useEffect(() => {
      totalDurationRef.current = totalDuration;
   }, [totalDuration]);

   // Update actual progress shared value when playback position or duration changes
   useEffect(() => {
      if (totalDuration === 0) {
         actualProgressValue.value = 0;
      } else {
         actualProgressValue.value = playbackPosition / totalDuration;
      }
   }, [playbackPosition, totalDuration, actualProgressValue]);

   // Handle progress bar layout to get width and position
   const handleProgressBarLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
      // The wrapper includes padding, so we need to subtract it to get the actual progress bar width
      const wrapperWidth = event.nativeEvent.layout.width;
      wrapperWidthRef.current = wrapperWidth;
      // Subtract horizontal padding on each side
      progressBarWidthRef.current = wrapperWidth - PROGRESS_BAR_INSET;

      // Measure position in window for drag calculations (use setTimeout to ensure layout is complete)
      setTimeout(() => {
         if (progressBarWrapperRef.current) {
            progressBarWrapperRef.current.measureInWindow((x, y, width, height) => {
               wrapperXRef.current = x;
               wrapperYRef.current = y;
               wrapperWidthRef.current = width;
               wrapperHeightRef.current = height;
            });
         }
      }, 0);
   };

   // Helper function to update displayed time (called from worklet)
   const updateDisplayedTime = useCallback((time: number) => {
      setDisplayedTime(time);
   }, []);

   // Helper function to seek to time (called from worklet)
   const seekToTimeFromWorklet = useCallback((time: number) => {
      seekToTime(time);
   }, [seekToTime]);

   // Store initial touch position for PanResponder
   const initialTouchXRef = useRef(0);
   const initialTouchYRef = useRef(0);
   const hasMovedRef = useRef(false);
   const isDragCancelledRef = useRef(false);

   // Pan responder for progress bar dragging
   // Use useRef to create once, but access current values from closure/refs
   const progressBarPanResponder = useRef(
      PanResponder.create({
         onStartShouldSetPanResponder: () => {
            // Access totalDuration from ref to get current value (not stale closure)
            // Allow activation if totalDuration is valid - width will be measured in Grant if needed
            // This ensures PanResponder can activate even if layout hasn't been measured yet
            return totalDurationRef.current > 0;
         },
         onStartShouldSetPanResponderCapture: () => {
            // Same check - capture early to prevent parent from interfering
            return totalDurationRef.current > 0;
         },
         onMoveShouldSetPanResponder: (_evt, gestureState) => {
            // Fallback: if start didn't activate, catch horizontal movement
            // Very low threshold (1px) to catch any horizontal movement
            if (totalDurationRef.current === 0) return false;
            return Math.abs(gestureState.dx) > 1 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
         },
         onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
            // Capture horizontal movements early
            if (totalDurationRef.current === 0) return false;
            return Math.abs(gestureState.dx) > 1 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
         },
         onPanResponderGrant: (evt) => {
            // Initialize drag - prevent progress updates from interfering
            isDraggingValue.value = true;
            setDragging(true);
            hasMovedRef.current = false;
            isDragCancelledRef.current = false;

            // CRITICAL: Initialize drag progress with current actual progress to prevent jump to 0
            // This ensures smooth transition when user touches the handle
            dragProgressValue.value = actualProgressValue.value;

            // Use locationX which is relative to the touchable view - more reliable
            // locationX is relative to progressBarTouchable, which is inside the wrapper with padding
            const locationX = evt.nativeEvent.locationX || 0;
            const pageY = evt.nativeEvent.pageY;

            // Store initial positions
            initialTouchXRef.current = locationX;
            initialTouchYRef.current = pageY;

            // Measure wrapper position for vertical drag cancellation (not for position calculation)
            if (progressBarWrapperRef.current) {
               try {
                  progressBarWrapperRef.current.measureInWindow((x, y, width, height) => {
                     wrapperXRef.current = x;
                     wrapperYRef.current = y;
                     wrapperWidthRef.current = width;
                     wrapperHeightRef.current = height;
                  });
               } catch (e) {
                  // Measurement failed, continue with locationX-based calculation
               }
            }

            // Ensure width is available - measure if needed
            let width = progressBarWidthRef.current;
            if (width === 0) {
               if (progressBarWrapperRef.current) {
                  try {
                     progressBarWrapperRef.current.measure((_x, _y, measuredWidth) => {
                        const barWidth = Math.max(0, measuredWidth - PROGRESS_BAR_INSET);
                        progressBarWidthRef.current = barWidth;
                        width = barWidth;
                     });
                  } catch (e) {
                     // Fallback width
                     width = 300;
                     progressBarWidthRef.current = width;
                  }
               } else {
                  width = 300;
                  progressBarWidthRef.current = width;
               }
            }

            // Calculate touch position relative to progress bar
            // Account for 8px padding on left side
            const touchRelativeX = Math.max(0, Math.min(width, locationX - 8));
            const touchPercentage = Math.max(0, Math.min(1, touchRelativeX / width));

            // Update displayed time based on touch position
            const targetTime = touchPercentage * totalDurationRef.current;
            runOnJS(updateDisplayedTime)(Math.floor(targetTime));
         },
         onPanResponderMove: (evt, gestureState) => {
            if (totalDurationRef.current === 0) return;
            if (isDragCancelledRef.current) return;

            // Ensure width is available - use fallback if not measured
            const width = progressBarWidthRef.current || 300;
            if (width === 0) return;

            // Check if touch has moved too far vertically from progress bar
            const currentPageY = evt.nativeEvent.pageY;
            const y = wrapperYRef.current;
            const height = wrapperHeightRef.current;
            const verticalTolerance = 30; // Allow some vertical movement tolerance

            // If finger moved too far vertically, cancel the drag
            if (
               (y > 0 || height > 0) && // Only check if position is measured
               (currentPageY < y - verticalTolerance ||
                  currentPageY > y + height + verticalTolerance)
            ) {
               isDragCancelledRef.current = true;
               // Cancel drag and reset
               isDraggingValue.value = false;
               setDragging(false);
               return;
            }

            // Track that user has moved (dragging, not just tapping)
            if (Math.abs(gestureState.dx) > 2) {
               hasMovedRef.current = true;
            }

            // Calculate position based on initial touch position + horizontal movement
            // This ensures consistent dragging regardless of where user initially touched
            // dx is in pixels, convert to percentage by dividing by width
            const dxPercentage = gestureState.dx / width;

            // Use the initial touch position as the starting point
            const initialTouchX = initialTouchXRef.current;
            const initialTouchRelativeX = Math.max(0, Math.min(width, initialTouchX - 8));
            const initialTouchPercentage = Math.max(0, Math.min(1, initialTouchRelativeX / width));

            // Calculate new position: initial touch position + movement
            const newPercentage = Math.max(0, Math.min(1, initialTouchPercentage + dxPercentage));

            // Update drag progress directly in shared value (no re-render)
            dragProgressValue.value = newPercentage;

            // Update displayed time via runOnJS (only updates state when needed)
            const targetTime = newPercentage * totalDurationRef.current;
            runOnJS(updateDisplayedTime)(Math.floor(targetTime));
         },
         onPanResponderRelease: (_evt, gestureState) => {
            if (totalDurationRef.current === 0) {
               isDraggingValue.value = false;
               setDragging(false);
               return;
            }

            // Ensure width is available - use fallback if not measured
            const width = progressBarWidthRef.current || 300;
            if (width === 0) {
               isDraggingValue.value = false;
               setDragging(false);
               return;
            }

            // If drag was cancelled, don't seek
            if (isDragCancelledRef.current) {
               isDraggingValue.value = false;
               setDragging(false);
               setDisplayedTime(0);
               return;
            }

            // Calculate final position using initial touch + dx (consistent with Move handler)
            const initialTouchX = initialTouchXRef.current;
            const initialTouchRelativeX = Math.max(0, Math.min(width, initialTouchX - 8));
            const initialTouchPercentage = Math.max(0, Math.min(1, initialTouchRelativeX / width));

            // Calculate final position: initial touch position + movement
            const dxPercentage = gestureState.dx / width;
            const percentage = Math.max(0, Math.min(1, initialTouchPercentage + dxPercentage));
            const targetTime = percentage * totalDurationRef.current;

            // CRITICAL: Update actualProgressValue to match drag position BEFORE releasing drag state
            // This prevents flicker by ensuring smooth transition from drag to actual progress
            actualProgressValue.value = percentage;

            // Now safe to release drag state - visual will stay at same position
            isDraggingValue.value = false;
            setDragging(false);

            // Seek to final position (only once, no double-seeking)
            runOnJS(seekToTimeFromWorklet)(targetTime);

            // Reset displayed time after a brief delay
            setTimeout(() => {
               setDisplayedTime(0);
            }, 100);
         },
         onPanResponderTerminate: () => {
            // Cancel drag on termination
            isDraggingValue.value = false;
            setDragging(false);
            setDisplayedTime(0);
            hasMovedRef.current = false;
            isDragCancelledRef.current = false;
         },
      })
   ).current;

   // Unified animated style for progress fill - switches between drag and actual progress
   const progressFillAnimatedStyle = useAnimatedStyle(() => {
      // Use drag progress when dragging, otherwise use actual progress
      const progress = isDraggingValue.value ? dragProgressValue.value : actualProgressValue.value;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      return {
         width: `${clampedProgress * 100}%`,
      };
   });

   // Unified animated style for progress handle position
   const progressHandleAnimatedStyle = useAnimatedStyle(() => {
      // Use drag progress when dragging, otherwise use actual progress
      const progress = isDraggingValue.value ? dragProgressValue.value : actualProgressValue.value;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      return {
         left: `${clampedProgress * 100}%`,
         transform: [{ translateX: -PROGRESS_HANDLE_CENTER_OFFSET }],
      };
   });

   // Update displayed time when dragging (using animated reaction to avoid re-renders)
   useAnimatedReaction(
      () => {
         if (isDraggingValue.value && totalDuration > 0) {
            return Math.floor(dragProgressValue.value * totalDuration);
         }
         return null;
      },
      (time) => {
         if (time !== null) {
            runOnJS(updateDisplayedTime)(time);
         }
      },
      [totalDuration]
   );

   // Get chapter cover image URI based on minimized state
   const chapterCoverUri = useMemo(() => {
      if (!chapterMetadata) return undefined;

      // Use minimizedChapterCoverImage when minimized, maximizedChapterCoverImage when maximized
      const imagePath = isMinimized
         ? chapterMetadata.minimizedChapterCoverImage
         : chapterMetadata.maximizedChapterCoverImage;

      // Fallback to coverImage if specific image is not available
      const finalImagePath = imagePath || chapterMetadata.coverImage;

      if (!finalImagePath) return undefined;
      return `${apiConfig.baseURL}${finalImagePath}`;
   }, [chapterMetadata, isMinimized]);

   // Handle play/pause toggle
   const handlePlayPause = useCallback(() => {
      if (isPlaying) {
         void pausePlayback();
         // Sync playback state when pausing (only if player is active)
         if (isVisible && audiobookId && currentChapterId) {
            syncPlayback({
               audiobookId,
               chapterId: currentChapterId,
               action: 'pause',
               position: playbackPosition,
            }).catch((error: unknown) => {
               console.error('[Audio Player] Failed to sync playback on pause:', error);
            });
         }
      } else {
         void playPlayback();
         // Sync playback state immediately when user clicks play (only if player is active)
         // The usePlaybackSync hook will also call play action after 1 second, but we call it immediately here
         // to ensure the API is called as soon as the user clicks play
         if (isVisible && audiobookId && currentChapterId) {
            syncPlayback({
               audiobookId,
               chapterId: currentChapterId,
               action: 'play',
               position: playbackPosition,
            }).catch((error: unknown) => {
               console.error('[Audio Player] Failed to sync playback on play:', error);
            });
         }
      }
   }, [
      isPlaying,
      isVisible,
      audiobookId,
      currentChapterId,
      playbackPosition,
      playPlayback,
      pausePlayback,
   ]);

   // Handle expand (when clicking on minimized player)
   const handleExpand = () => {
      dispatch(setMinimized(false));
   };

   const handleClose = useCallback(() => {
      void (async () => {
         if (isPlaying && audiobookId && currentChapterId) {
            await syncPlayback({
               audiobookId,
               chapterId: currentChapterId,
               action: 'pause',
               position: playbackPosition,
            }).catch((error: unknown) => {
               console.error('[Audio Player] Failed to sync playback on close:', error);
            });
            await pausePlayback();
         }
         await resetPlayer();
         dispatch(releasePlayback());
      })();
   }, [
      isPlaying,
      audiobookId,
      currentChapterId,
      playbackPosition,
      pausePlayback,
      resetPlayer,
      dispatch,
   ]);

   useEffect(() => {
      isMinimizedRef.current = isMinimized;
   }, [isMinimized]);

   const handleNotesPress = useCallback(() => {
      if (!audiobookId || !currentChapterId) return;
      dispatch(setUiSuppressed(true));
      dispatch(setMinimized(true));
      router.push({
         pathname: '/chapter-comments',
         params: {
            audiobookId,
            chapterId: currentChapterId,
            chapterTitle: chapterMetadata?.title ?? 'Chapter',
            ...(chapterMetadata?.chapterNumber != null
               ? { chapterNumber: String(chapterMetadata.chapterNumber) }
               : {}),
         },
      } as never);
   }, [audiobookId, currentChapterId, chapterMetadata?.title, chapterMetadata?.chapterNumber, dispatch]);

   // Pan responder for drag-to-minimize on the top handle / header zone
   const panResponder = useRef(
      PanResponder.create({
         onStartShouldSetPanResponder: () => false,
         onStartShouldSetPanResponderCapture: () => false,
         onMoveShouldSetPanResponder: (_evt, gestureState) => {
            if (isMinimizedRef.current) return false;
            return (
               gestureState.dy > 6 &&
               gestureState.dy > Math.abs(gestureState.dx)
            );
         },
         onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
            if (isMinimizedRef.current) return false;
            return (
               gestureState.dy > 6 &&
               gestureState.dy > Math.abs(gestureState.dx)
            );
         },
         onPanResponderGrant: (evt) => {
            isDraggingDown.current = true;
            dragStartY.current = evt.nativeEvent.pageY;
            dragY.value = 0;
         },
         onPanResponderMove: (_evt, gestureState) => {
            if (isDraggingDown.current && gestureState.dy > 0) {
               dragY.value = Math.max(0, gestureState.dy);
            }
         },
         onPanResponderRelease: (_evt, gestureState) => {
            isDraggingDown.current = false;
            if (gestureState.dy > 80) {
               dispatch(setMinimized(true));
               dragY.value = withSpring(0, {
                  damping: 20,
                  stiffness: 200,
               });
            } else {
               dragY.value = withSpring(0, {
                  damping: 15,
                  stiffness: 150,
               });
            }
         },
         onPanResponderTerminate: () => {
            isDraggingDown.current = false;
            dragY.value = withSpring(0, {
               damping: 15,
               stiffness: 150,
            });
         },
      })
   ).current;

   // Animated style for drag-to-minimize
   const dragAnimatedStyle = useAnimatedStyle(() => {
      return {
         transform: [{ translateY: dragY.value }],
      };
   });

   const handleBackward = () => {
      handleSeek(-skipDurationSeconds);
   };

   const handleForward = () => {
      handleSeek(skipDurationSeconds);
   };

   // Calculate elapsed time for display (absolute position)
   const elapsedTime = useMemo(() => {
      return Math.floor(playbackPosition);
   }, [playbackPosition]);

   // Calculate total time for display
   const totalTime = useMemo(() => {
      return Math.floor(totalDuration);
   }, [totalDuration]);

   const minimizedProgress = useMemo(() => {
      if (totalDuration <= 0) return 0;
      return Math.min(1, Math.max(0, playbackPosition / totalDuration));
   }, [playbackPosition, totalDuration]);

   const minimizedChapterLabel = useMemo(() => {
      if (!chapterMetadata?.chapterNumber) {
         return 'Chapter';
      }
      if (chapterMetadata.totalChapters) {
         return `Chapter ${chapterMetadata.chapterNumber} of ${chapterMetadata.totalChapters}`;
      }
      return `Chapter ${chapterMetadata.chapterNumber}`;
   }, [chapterMetadata]);

   const minimizedElapsed = useMemo(() => Math.floor(playbackPosition), [playbackPosition]);

   // Calculate dynamic tab bar height with safe area insets (needed for animations)
   const tabBarHeight = getTabBarHeight(insets.bottom);
   const playerFloatHorizontal = getTabBarFloatHorizontal();
   /** Full player sits near the screen bottom with a small margin above the safe area */
   const maximizedBottomPosition = insets.bottom + spacing.sm;

   /** Keep the card within the safe area (top inset + bottom anchor) */
   const fullPlayerLayout = useMemo(() => {
      const topMargin = spacing.sm;
      const maxHeight = SCREEN_HEIGHT - maximizedBottomPosition - insets.top - topMargin;
      const coverSize = Math.min(FP.coverSize, Math.max(152, Math.round(maxHeight * 0.24)));
      return {
         maxHeight: Math.max(300, maxHeight),
         coverSize,
      };
   }, [maximizedBottomPosition, insets.top]);

   // Minimized bar: above tab bar on tab screens, near bottom on stack screens (e.g. details)
   const minimizedBottomPosition = useMemo(
      () => getMinimizedPlayerBottom(hasBottomTabBar, insets.bottom),
      [hasBottomTabBar, insets.bottom]
   );

   const targetContainerBottom = isMinimized
      ? minimizedBottomPosition
      : maximizedBottomPosition;

   // Smooth spring when bottom offset changes (route change or minimize/maximize)
   useEffect(() => {
      cancelAnimation(containerBottom);
      if (!hasInitializedBottomRef.current) {
         containerBottom.value = targetContainerBottom;
         hasInitializedBottomRef.current = true;
         return;
      }
      containerBottom.value = withSpring(targetContainerBottom, PLAYER_BOTTOM_SPRING);
   }, [targetContainerBottom, containerBottom]);

   // Re-measure wrapper position when player becomes visible
   useEffect(() => {
      if (isVisible && progressBarWrapperRef.current) {
         // Small delay to ensure layout is complete
         const timer = setTimeout(() => {
            if (progressBarWrapperRef.current) {
               progressBarWrapperRef.current.measureInWindow((x, y, width, height) => {
                  wrapperXRef.current = x;
                  wrapperYRef.current = y;
                  wrapperWidthRef.current = width;
                  wrapperHeightRef.current = height;
               });
            }
         }, 100);
         return () => clearTimeout(timer);
      }
      return undefined;
   }, [isVisible]);

   // Handle open/close animations
   useEffect(() => {
      if (!isMountedRef.current) {
         // Initial mount - set initial values based on visibility
         if (isVisible) {
            // Always set translateY to 0 when visible (both minimized and maximized)
            translateY.value = 0;
            opacity.value = 1;
            // Set opacity immediately and synchronously - no animation on initial mount
            if (isMinimized) {
               minimizedOpacity.value = 1;
               fullPlayerOpacity.value = 0;
            } else {
               fullPlayerOpacity.value = 1;
               minimizedOpacity.value = 0;
            }
         } else {
            const bottomOffset = isMinimized ? minimizedBottomPosition : maximizedBottomPosition;
            const containerHeight = SCREEN_HEIGHT - bottomOffset;
            translateY.value = containerHeight;
            opacity.value = 0;
         }
         isMountedRef.current = true;
         previousVisibleRef.current = isVisible;
         previousMinimizedRef.current = isMinimized;
         return;
      }

      // Handle visibility changes (open/close)
      if (isVisible !== previousVisibleRef.current) {
         if (isVisible) {
            // Player is opening - initialize playback session every time the player opens
            // This ensures the session API is called when the player is opened, even if it's the same chapter
            // We check if this is a new "open" event (was not visible before) to avoid duplicate calls
            if (
               currentChapterId &&
               audiobookId &&
               user?.id &&
               !previousVisibleRef.current // Only call if player was previously closed
            ) {
               initializePlaybackSession({
                  userId: user.id,
                  audiobookId,
                  chapterId: currentChapterId,
               }).catch((error: unknown) => {
                  // Log error but don't block playback
                  console.error('[Audio Player] Failed to initialize playback session:', error);
               });
            }

            // Opening animation - set initial state for minimize/maximize views immediately
            // Set opacity synchronously before animation to ensure visibility
            if (isMinimized) {
               minimizedOpacity.value = 1;
               fullPlayerOpacity.value = 0;
            } else {
               fullPlayerOpacity.value = 1;
               minimizedOpacity.value = 0;
            }

            // Opening animation - animate from container height to 0
            translateY.value = withTiming(0, {
               duration: 350,
               easing: Easing.out(Easing.ease),
            });
            opacity.value = withTiming(1, {
               duration: 350,
               easing: Easing.out(Easing.ease),
            });
         } else {
            const bottomOffset = isMinimized ? minimizedBottomPosition : maximizedBottomPosition;
            const containerHeight = SCREEN_HEIGHT - bottomOffset;
            translateY.value = withTiming(containerHeight, {
               duration: 300,
               easing: Easing.in(Easing.ease),
            });
            opacity.value = withTiming(0, {
               duration: 300,
               easing: Easing.in(Easing.ease),
            });
         }
         previousVisibleRef.current = isVisible;
      }

      // Handle minimize/maximize animations
      if (isVisible && isMinimized !== previousMinimizedRef.current) {
         // CRITICAL: Reset dragY before starting minimize/maximize animations
         // This prevents conflicts between drag animation and minimize/maximize animations
         dragY.value = 0;

         // Ensure container opacity remains at 1 during minimize/maximize transitions
         // Container should only fade out when isVisible becomes false, not when minimizing
         opacity.value = 1;

         // When minimizing, ensure translateY is 0 (PiP window should not be translated)
         // When maximizing, translateY should already be 0 from open animation
         if (isMinimized) {
            translateY.value = 0;
         }

         if (isMinimized) {
            // Minimizing animation - fade out full player while fading in minimized player
            // Fade out full player
            fullPlayerOpacity.value = withTiming(0, {
               duration: 300,
               easing: Easing.out(Easing.ease),
            });
            // Fade in minimized player (Reanimated will use current value as start)
            minimizedOpacity.value = withTiming(1, {
               duration: 300,
               easing: Easing.out(Easing.ease),
            });
         } else {
            // Maximizing animation - fade out minimized player while fading in full player
            // Fade out minimized player
            minimizedOpacity.value = withTiming(0, {
               duration: 300,
               easing: Easing.out(Easing.ease),
            });
            // Fade in full player (Reanimated will use current value as start)
            fullPlayerOpacity.value = withTiming(1, {
               duration: 300,
               easing: Easing.out(Easing.ease),
            });
         }
         previousMinimizedRef.current = isMinimized;
      } else if (isVisible && isMinimized === previousMinimizedRef.current) {
         // Ensure opacity values are synchronized when player is visible but state hasn't changed
         // This is a safety check to ensure correct opacity values (e.g., after remount)
         // Also ensure container opacity stays at 1
         opacity.value = 1;

         // Ensure translateY is correct for current state
         if (isMinimized) {
            // When minimized, ensure translateY is 0 (PiP window should not be translated)
            translateY.value = 0;
            // When minimized, ensure minimized player is visible and full player is hidden
            minimizedOpacity.value = 1;
            fullPlayerOpacity.value = 0;
         } else {
            // When maximized, ensure translateY is 0 (full player should be visible)
            translateY.value = 0;
            // When maximized, ensure full player is visible and minimized player is hidden
            fullPlayerOpacity.value = 1;
            minimizedOpacity.value = 0;
         }
      }
   }, [isVisible, isMinimized, translateY, opacity, fullPlayerOpacity, minimizedOpacity, dragY, tabBarHeight, insets.bottom, maximizedBottomPosition, minimizedBottomPosition, hasBottomTabBar]);

   // Animated styles - must be called before early return (Rules of Hooks)
   const containerAnimatedStyle = useAnimatedStyle(() => {
      return {
         bottom: containerBottom.value,
         transform: [{ translateY: translateY.value }],
         opacity: opacity.value,
      };
   });

   const fullPlayerAnimatedStyle = useAnimatedStyle(() => {
      return {
         opacity: fullPlayerOpacity.value,
      };
   });

   const minimizedAnimatedStyle = useAnimatedStyle(() => {
      return {
         opacity: minimizedOpacity.value,
      };
   });


   // Don't render if not visible or no chapter or no playlist URI
   if (!isVisible || !currentChapterId || isUiSuppressed) {
      return null;
   }

   return (
      <Animated.View
         style={[
            styles.container,
            containerAnimatedStyle,
            {
               // When minimized: floating bar; when maximized: full-width card
               ...(isMinimized
                  ? {
                     left: playerFloatHorizontal,
                     right: playerFloatHorizontal,
                     backgroundColor: 'transparent',
                  }
                  : {
                     // Maximized: floating card anchored near screen bottom
                     left: playerFloatHorizontal,
                     right: playerFloatHorizontal,
                     backgroundColor: 'transparent',
                  }
               ),
               zIndex: 250,
               elevation: 250,
            }
         ]}
      >
         {isMinimized ? (
            <Animated.View
               style={[minimizedAnimatedStyle, styles.minimizedBarOuter]}
               pointerEvents="auto"
            >
               <TouchableOpacity
                  style={styles.minimizedBar}
                  onPress={handleExpand}
                  activeOpacity={0.92}
               >
                  <View style={styles.minimizedCoverWrap}>
                     {chapterCoverUri ? (
                        <Image
                           source={{ uri: chapterCoverUri }}
                           style={styles.minimizedCoverImage}
                           contentFit="cover"
                        />
                     ) : (
                        <View style={[styles.minimizedCoverImage, styles.minimizedCoverPlaceholder]}>
                           <Ionicons name="musical-notes" size={22} color={colors.text.secondary} />
                        </View>
                     )}
                  </View>

                  <View style={styles.minimizedInfo}>
                     <Text style={styles.minimizedTitle} numberOfLines={1}>
                        {chapterMetadata?.title || 'Loading...'}
                     </Text>
                     <Text style={styles.minimizedChapterMeta} numberOfLines={1}>
                        {minimizedChapterLabel}
                     </Text>
                     <Text style={styles.minimizedTimeText}>
                        {formatDuration(minimizedElapsed)} / {formatDuration(totalTime)}
                     </Text>
                     <View style={styles.minimizedProgressTrack}>
                        <View
                           style={[
                              styles.minimizedProgressFill,
                              { width: `${minimizedProgress * 100}%` },
                           ]}
                        />
                     </View>
                  </View>

                  <View style={styles.minimizedTrailingControls}>
                     <TouchableOpacity
                        onPress={(e) => {
                           e.stopPropagation();
                           handlePlayPause();
                        }}
                        style={styles.minimizedPlayControl}
                        activeOpacity={0.8}
                        disabled={isLoading}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                     >
                        {isLoading ? (
                           <ActivityIndicator size="small" color={colors.accent.primaryDark} />
                        ) : (
                           <Ionicons
                              name={isPlaying ? 'pause' : 'play'}
                              size={MINIMIZED_BAR.playIconSize}
                              color={colors.accent.primaryDark}
                              style={!isPlaying ? styles.playIconOffset : undefined}
                           />
                        )}
                     </TouchableOpacity>
                     <TouchableOpacity
                        onPress={(e) => {
                           e.stopPropagation();
                           handleClose();
                        }}
                        style={styles.minimizedCloseControl}
                        activeOpacity={0.7}
                        accessibilityLabel="Close player"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                     >
                        <Ionicons
                           name="close"
                           size={22}
                           color={colors.accent.primaryDark}
                        />
                     </TouchableOpacity>
                  </View>
               </TouchableOpacity>
            </Animated.View>
         ) : (
            <View style={styles.playerSheet}>
               <Animated.View
                  style={[
                     styles.playerContainer,
                     { height: fullPlayerLayout.maxHeight },
                     fullPlayerAnimatedStyle,
                     dragAnimatedStyle,
                  ]}
               >
                  {/* Top zone: drag handle + header — not inside ScrollView so pull-down works */}
                  <View
                     style={styles.dragMinimizeZone}
                     {...panResponder.panHandlers}
                     collapsable={false}
                  >
                     <View
                        style={styles.dragHandlerContainer}
                        pointerEvents="box-none"
                     >
                        <View style={styles.dragHandler} />
                     </View>

                     <View style={styles.header}>
                        <TouchableOpacity
                           onPress={handleClose}
                           style={styles.closeButton}
                           activeOpacity={0.7}
                           accessibilityLabel="Close player"
                        >
                           <Ionicons name="close" size={FP.headerMenuIconSize} color={colors.accent.primaryDark} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} activeOpacity={0.7}>
                           <Ionicons name="ellipsis-horizontal" size={FP.headerMenuIconSize} color={colors.accent.primaryDark} />
                        </TouchableOpacity>
                     </View>
                  </View>

                  <ScrollView
                     style={styles.playerScrollContent}
                     contentContainerStyle={styles.playerScrollContentContainer}
                     showsVerticalScrollIndicator={false}
                     bounces={false}
                     nestedScrollEnabled
                  >
                     {/* Cover + chapter info */}
                     {chapterCoverUri && (
                        <View
                           style={[
                              styles.coverContainer,
                              {
                                 width: fullPlayerLayout.coverSize,
                                 height: fullPlayerLayout.coverSize,
                              },
                           ]}
                        >
                           <Image
                              source={{ uri: chapterCoverUri }}
                              style={styles.coverImage}
                              contentFit="cover"
                           />
                        </View>
                     )}
                     <Text style={styles.chapterLabel}>Chapter</Text>
                     <Text style={styles.chapterTitle} numberOfLines={2}>
                        {chapterMetadata?.title || 'Loading...'}
                     </Text>
                  </ScrollView>

                  <View style={styles.playerFixedFooter}>
                     {/* Progress Bar */}
                     <View style={styles.progressContainer}>
                     <View
                        ref={progressBarWrapperRef}
                        style={styles.progressBarWrapper}
                        onLayout={handleProgressBarLayout}
                        collapsable={false}
                     >
                        <View
                           style={styles.progressBarTouchable}
                           {...progressBarPanResponder.panHandlers}
                           collapsable={false}
                        >
                           <View style={styles.progressBarContainer}>
                              <View style={styles.progressBar}>
                                 <Animated.View
                                    style={[
                                       styles.progressFill,
                                       progressFillAnimatedStyle,
                                    ]}
                                 />
                              </View>
                              <Animated.View
                                 style={[
                                    styles.progressHandle,
                                    progressHandleAnimatedStyle,
                                 ]}
                              />
                           </View>
                        </View>
                     </View>
                     <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>
                           {displayedTime > 0
                              ? formatDuration(displayedTime)
                              : formatDuration(elapsedTime)}
                        </Text>
                        <Text style={styles.timeText}>
                           {formatDuration(totalTime)}
                        </Text>
                        <Text style={styles.timeText}>
                           -{formatDuration(Math.max(0, totalTime - (displayedTime > 0 ? displayedTime : elapsedTime)))}
                        </Text>
                     </View>
                     </View>

                     {/* Secondary controls */}
                     <View style={styles.secondaryControls}>
                     <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>Speed (1.0x)</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>Timer</Text>
                     </TouchableOpacity>
                     </View>

                     {/* Controls */}
                     <View style={styles.controlsContainer}>
                     {error ? (
                        <View style={styles.errorContainer}>
                           <Text style={styles.errorText}>{error}</Text>
                           <TouchableOpacity
                              onPress={handlePlayPause}
                              style={styles.retryButton}
                           >
                              <Text style={styles.retryButtonText}>Retry</Text>
                           </TouchableOpacity>
                        </View>
                     ) : (
                        <View style={styles.controlsRow}>
                           <TouchableOpacity
                              onPress={() => void skipToPreviousChapter()}
                              style={styles.chapterButton}
                              activeOpacity={0.8}
                              disabled={isLoading}
                           >
                              <Ionicons
                                 name="play-skip-back"
                                 size={FP.chapterSkipIconSize}
                                 color={colors.accent.primaryDark}
                              />
                           </TouchableOpacity>

                           <TouchableOpacity
                              onPress={handleBackward}
                              style={styles.seekButton}
                              activeOpacity={0.8}
                              disabled={isLoading}
                           >
                              <Ionicons
                                 name="play-back-circle"
                                 size={FP.seekIconSize}
                                 color={colors.accent.primaryDark}
                              />
                              <Text style={styles.seekButtonText}>{skipDurationSeconds}s</Text>
                           </TouchableOpacity>

                           {/* Play/Pause Button */}
                           <TouchableOpacity
                              onPress={handlePlayPause}
                              style={styles.playButton}
                              activeOpacity={0.8}
                              disabled={isLoading}
                           >
                              {isLoading ? (
                                 <ActivityIndicator
                                    size="large"
                                    color={colors.accent.primaryDark}
                                 />
                              ) : (
                                 <View style={styles.iconWrapper}>
                                    <Ionicons
                                       name={isPlaying ? 'pause' : 'play'}
                                       size={FP.playIconSize}
                                       color="#FFFFFF"
                                       style={!isPlaying ? styles.playIconOffset : undefined}
                                    />
                                 </View>
                              )}
                           </TouchableOpacity>

                           <TouchableOpacity
                              onPress={handleForward}
                              style={styles.seekButton}
                              activeOpacity={0.8}
                              disabled={isLoading}
                           >
                              <Ionicons
                                 name="play-forward-circle"
                                 size={FP.seekIconSize}
                                 color={colors.accent.primaryDark}
                              />
                              <Text style={styles.seekButtonText}>{skipDurationSeconds}s</Text>
                           </TouchableOpacity>

                           <TouchableOpacity
                              onPress={() => void skipToNextChapter()}
                              style={styles.chapterButton}
                              activeOpacity={0.8}
                              disabled={isLoading}
                           >
                              <Ionicons
                                 name="play-skip-forward"
                                 size={FP.chapterSkipIconSize}
                                 color={colors.accent.primaryDark}
                              />
                           </TouchableOpacity>
                        </View>
                     )}
                     </View>

                     {/* Bottom action row */}
                     <View style={styles.bottomActions}>
                     <TouchableOpacity style={styles.bottomAction} activeOpacity={0.7}>
                        <Ionicons name="bookmark-outline" size={FP.bottomActionIconSize} color={colors.accent.primaryDark} />
                        <Text style={styles.bottomActionText}>Bookmark</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.bottomAction} activeOpacity={0.7}>
                        <Ionicons name="list-outline" size={FP.bottomActionIconSize} color={colors.accent.primaryDark} />
                        <Text style={styles.bottomActionText}>Chapters</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.bottomAction} onPress={handleNotesPress} activeOpacity={0.7}>
                        <Ionicons name="chatbubble-outline" size={FP.bottomActionIconSize} color={colors.accent.primaryDark} />
                        <Text style={styles.bottomActionText}>Notes</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.bottomAction} activeOpacity={0.7}>
                        <Ionicons name="cut-outline" size={FP.bottomActionIconSize} color={colors.accent.primaryDark} />
                        <Text style={styles.bottomActionText}>Clip</Text>
                     </TouchableOpacity>
                     </View>
                  </View>
               </Animated.View>
            </View>
         )}
      </Animated.View>
   );
});

AudioPlayer.displayName = 'AudioPlayer';

const styles = StyleSheet.create({
   container: {
      position: 'absolute',
      // bottom, left, right, width will be set dynamically based on minimized state
      // When minimized: floating PiP window in bottom-right (left not set, right set inline)
      // When maximized: full width above tab bar (left: 0, right: 0 set inline)
      // Note: left is not set in base style so it can be undefined when minimized
      backgroundColor: 'transparent',
      // zIndex and elevation set conditionally based on minimized state
      overflow: 'visible',
   },
   playerSheet: {
      alignSelf: 'stretch',
   },
   hiddenVideo: {
      width: 0,
      height: 0,
      position: 'absolute',
   },
   playerContainer: {
      paddingHorizontal: FP.paddingHorizontal,
      paddingTop: FP.paddingTop,
      paddingBottom: FP.paddingBottom,
      backgroundColor: colors.background.player,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: 'hidden',
      ...shadows.lg,
      ...Platform.select({
         android: { elevation: 12 },
      }),
   },
   playerScrollContent: {
      flexGrow: 0,
      flexShrink: 1,
      minHeight: 0,
   },
   playerScrollContentContainer: {
      flexGrow: 1,
   },
   dragMinimizeZone: {
      flexShrink: 0,
   },
   playerFixedFooter: {
      flexShrink: 0,
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: FP.headerMarginBottom,
   },
   chapterLabel: {
      fontSize: FP.chapterLabelSize,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.xs,
   },
   chapterTitle: {
      fontSize: FP.chapterTitleSize,
      fontWeight: '700',
      color: colors.accent.primaryDark,
      textAlign: 'center',
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
   },
   secondaryControls: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: FP.secondaryGap,
      marginBottom: FP.secondaryMarginBottom,
   },
   secondaryButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
   },
   secondaryButtonText: {
      fontSize: FP.secondaryButtonTextSize,
      color: colors.accent.primaryDark,
      fontWeight: '500',
   },
   bottomActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: FP.bottomActionsPaddingTop,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
   },
   bottomAction: {
      alignItems: 'center',
      padding: spacing.sm,
   },
   bottomActionText: {
      fontSize: FP.bottomActionTextSize,
      color: colors.text.secondary,
      marginTop: spacing.xs,
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      flex: 1,
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
   headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
   },
   dragHandlerContainer: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      minHeight: FP.dragHandlerMinHeight,
      justifyContent: 'center',
   },
   dragHandler: {
      width: FP.dragHandlerWidth,
      height: FP.dragHandlerHeight,
      backgroundColor: colors.text.secondaryDark,
      borderRadius: FP.dragHandlerHeight / 2,
      opacity: 0.5,
   },
   closeButton: {
      padding: spacing.xs,
   },
   coverContainer: {
      alignSelf: 'center',
      marginBottom: FP.coverMarginBottom,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
   },
   coverImage: {
      width: '100%',
      height: '100%',
   },
   progressContainer: {
      marginBottom: FP.progressMarginBottom,
   },
   progressBarWrapper: {
      marginBottom: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: FP.progressBarHorizontalPadding,
   },
   progressBarTouchable: {
      width: '100%',
      minHeight: FP.progressTouchMinHeight,
      justifyContent: 'center',
   },
   progressBarContainer: {
      position: 'relative',
      width: '100%',
      height: FP.progressBarHeight,
      justifyContent: 'center',
      ...Platform.select({
         ios: {
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 5,
         },
         android: {
            elevation: 3,
         },
      }),
   },
   progressBar: {
      height: FP.progressBarHeight,
      backgroundColor: colors.border.light,
      borderRadius: borderRadius.sm,
      overflow: 'hidden',
      width: '100%',
   },
   progressFill: {
      height: '100%',
      backgroundColor: colors.accent.primary,
      borderWidth: 0,
   },
   progressHandle: {
      position: 'absolute',
      width: FP.progressHandleSize,
      height: FP.progressHandleSize,
      borderRadius: FP.progressHandleSize / 2,
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
   },
   timeText: {
      fontSize: FP.timeTextSize,
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
   controlsContainer: {
      alignSelf: 'stretch',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: FP.controlsMarginBottom,
   },
   controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      width: '100%',
   },
   playButton: {
      width: FP.playButtonSize,
      height: FP.playButtonSize,
      borderRadius: FP.playButtonSize / 2,
      backgroundColor: colors.accent.primary,
      justifyContent: 'center',
      alignItems: 'center',
   },
   chapterButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      paddingVertical: spacing.xs,
   },
   seekButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 44,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
   },
   seekButtonText: {
      fontSize: FP.seekButtonTextSize,
      color: colors.text.secondaryDark,
      marginTop: spacing.xs,
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
   errorContainer: {
      alignItems: 'center',
   },
   errorText: {
      fontSize: typography.fontSize.sm,
      color: colors.app.red,
      marginBottom: spacing.md,
      textAlign: 'center',
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
   retryButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
   },
   retryButtonText: {
      fontSize: typography.fontSize.base,
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
   iconWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
   },
   playIconOffset: {
      marginLeft: 1, // Slight offset to visually center the play triangle
   },
   minimizedBarOuter: {
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      ...shadows.lg,
      ...Platform.select({
         android: { elevation: 12 },
      }),
   },
   minimizedBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: MINIMIZED_BAR.height,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background.player,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
      gap: spacing.sm,
   },
   minimizedCoverWrap: {
      width: MINIMIZED_BAR.coverSize,
      height: MINIMIZED_BAR.coverSize,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      flexShrink: 0,
   },
   minimizedCoverImage: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.background.highlight,
   },
   minimizedCoverPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
   },
   minimizedInfo: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: 2,
   },
   minimizedTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: '700',
      color: colors.accent.primaryDark,
   },
   minimizedChapterMeta: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
   },
   minimizedTimeText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginBottom: spacing.xs / 2,
   },
   minimizedProgressTrack: {
      height: 4,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.border.light,
      overflow: 'hidden',
   },
   minimizedProgressFill: {
      height: '100%',
      backgroundColor: colors.accent.primary,
      borderRadius: borderRadius.sm,
   },
   minimizedPlayControl: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   minimizedTrailingControls: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      gap: spacing.xs,
   },
   minimizedCloseControl: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
   },
});

