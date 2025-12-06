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
} from 'react-native';
import Animated, {
   useAnimatedStyle,
   useSharedValue,
   withTiming,
   withSpring,
   Easing,
   useAnimatedReaction,
   runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Video from 'react-native-video';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { play, pause, setVisible, setMinimized } from '@/store/player';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePlaybackSync } from '@/hooks/usePlaybackSync';
import { syncPlayback, initializePlaybackSession } from '@/services/audiobooks';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { formatDuration } from '@/utils/duration';
import { apiConfig } from '@/services/api';

/**
 * Audio Player component
 * Shows player UI when a chapter is being played
 */
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AudioPlayer: React.FC = React.memo(() => {
   const dispatch = useDispatch();
   const insets = useSafeAreaInsets();
   const {
      isPlaying,
      currentChapterId,
      playbackPosition,
      totalDuration,
      isLoading,
      error,
      isVisible,
      isMinimized,
      chapterMetadata,
      audiobookId,
   } = useSelector((state: RootState) => state.player);

   // Get user from Redux for session initialization
   const user = useSelector((state: RootState) => state.auth.user);

   // Animation shared values
   const translateY = useSharedValue(SCREEN_HEIGHT);
   const opacity = useSharedValue(0);
   const fullPlayerOpacity = useSharedValue(0);
   const minimizedOpacity = useSharedValue(0);
   const isMountedRef = useRef(false);
   const previousVisibleRef = useRef(false);
   const previousMinimizedRef = useRef(false);

   // Drag-to-minimize shared values and refs
   const dragY = useSharedValue(0);
   const isDraggingDown = useRef(false);
   const dragStartY = useRef(0);
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
      videoRef,
      masterPlaylistUri,
      headers,
      handleProgress,
      handleEnd,
      handleLoad,
      handleError,
      handleSeek,
      seekToTime,
      setDragging,
   } = useAudioPlayer();

   // Use media session hook for lock screen controls
   // react-native-video handles media session automatically when playInBackground is true
   useMediaSession();

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
      // Subtract horizontal padding (8px on each side = 16px total)
      progressBarWidthRef.current = wrapperWidth - 16;

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
                        const barWidth = Math.max(0, measuredWidth - 16);
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
         transform: [{ translateX: -8 }], // Center the handle (half of 16px width)
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
         dispatch(pause());
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
         dispatch(play());
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
   }, [isPlaying, isVisible, audiobookId, currentChapterId, playbackPosition, dispatch]);

   // Handle close
   const handleClose = () => {
      dispatch(setVisible(false));
   };

   // Handle expand (when clicking on minimized player)
   const handleExpand = () => {
      dispatch(setMinimized(false));
   };

   // Pan responder for drag-to-minimize functionality
   const panResponder = useRef(
      PanResponder.create({
         onStartShouldSetPanResponder: () => false,
         onStartShouldSetPanResponderCapture: () => false,
         onMoveShouldSetPanResponder: (_evt, gestureState) => {
            // Only respond to downward drags when player is maximized
            // Lower threshold to make it more responsive
            if (!isMinimized && gestureState.dy > 3 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
               return true;
            }
            return false;
         },
         onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
            // Only capture vertical downward drags
            // Explicitly allow horizontal touches (dx > dy) to pass through to child (seek bar)
            if (!isMinimized &&
               Math.abs(gestureState.dx) <= Math.abs(gestureState.dy) &&
               gestureState.dy > 3) {
               return true;
            }
            return false;
         },
         onPanResponderGrant: (evt) => {
            isDraggingDown.current = true;
            dragStartY.current = evt.nativeEvent.pageY;
            dragY.value = 0;
         },
         onPanResponderMove: (_evt, gestureState) => {
            if (isDraggingDown.current && gestureState.dy > 0) {
               // Only allow downward dragging
               dragY.value = Math.max(0, gestureState.dy);
            }
         },
         onPanResponderRelease: (_evt, gestureState) => {
            isDraggingDown.current = false;
            // If dragged down more than 80px, minimize the player
            if (gestureState.dy > 80) {
               dispatch(setMinimized(true));
               // Don't reset immediately - let the minimize animation handle it
               dragY.value = withSpring(0, {
                  damping: 20,
                  stiffness: 200,
               });
            } else {
               // Reset drag position if not enough drag
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

   // Handle 10s backward
   const handleBackward = () => {
      handleSeek(-10);
   };

   // Handle 10s forward
   const handleForward = () => {
      handleSeek(10);
   };

   // Calculate elapsed time for display (absolute position)
   const elapsedTime = useMemo(() => {
      return Math.floor(playbackPosition);
   }, [playbackPosition]);

   // Calculate total time for display
   const totalTime = useMemo(() => {
      return Math.floor(totalDuration);
   }, [totalDuration]);

   // Calculate dynamic tab bar height with safe area insets (needed for animations)
   const tabBarHeight = getTabBarHeight(insets.bottom);

   // Calculate bottom position for minimized PiP window (accounting for tab bar and safe area)
   const minimizedBottomPosition = tabBarHeight + spacing.md;

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
            // Calculate translateY based on container height instead of SCREEN_HEIGHT
            // Since container is positioned with bottom: tabBarHeight, we need to translate
            // by the container's height to hide it below the screen
            const containerHeight = SCREEN_HEIGHT - tabBarHeight;
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
            // Closing animation - animate to container height (not SCREEN_HEIGHT)
            // Calculate container height: screen height minus tab bar height
            const containerHeight = SCREEN_HEIGHT - tabBarHeight;
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
   }, [isVisible, isMinimized, translateY, opacity, fullPlayerOpacity, minimizedOpacity, dragY, tabBarHeight, insets.bottom]);

   // Animated styles - must be called before early return (Rules of Hooks)
   const containerAnimatedStyle = useAnimatedStyle(() => {
      return {
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
   if (!isVisible || !currentChapterId || !masterPlaylistUri) {
      return null;
   }

   return (
      <Animated.View
         style={[
            styles.container,
            containerAnimatedStyle,
            {
               // When minimized: floating PiP window in bottom-right
               // When maximized: full width, positioned above tab bar
               bottom: isMinimized ? minimizedBottomPosition : tabBarHeight,
               ...(isMinimized
                  ? {
                     // Minimized: floating PiP window
                     // Don't set left - let it be undefined to override base style
                     right: spacing.md,
                     width: 140, // Fixed width for PiP
                     height: 140, // Fixed height for PiP
                     backgroundColor: 'transparent',
                     // Ensure container is visible for debugging
                     // Remove this after confirming visibility
                  }
                  : {
                     // Maximized: full width player
                     left: 0,
                     right: 0,
                     width: '100%',
                     backgroundColor: colors.background.darkGray,
                  }
               ),
               zIndex: isMinimized ? 250 : 100,
               elevation: isMinimized ? 250 : 100,
            }
         ]}
      >
         {/* Hidden Video component for audio playback - Single instance that persists across minimize/maximize */}
         {masterPlaylistUri && (
            <Video
               ref={videoRef}
               source={{
                  uri: masterPlaylistUri,
                  bufferConfig: {
                     minBufferMs: 30000,
                     maxBufferMs: 120000,
                     bufferForPlaybackMs: 1000,
                     bufferForPlaybackAfterRebufferMs: 2000,
                  },
                  headers,
               }}
               paused={!isPlaying}
               onProgress={handleProgress}
               onEnd={handleEnd}
               onLoad={handleLoad}
               onError={handleError}
               style={styles.hiddenVideo}
               ignoreSilentSwitch="ignore"
               playInBackground={true}
               playWhenInactive={true}
               // Enable external playback (lock screen, AirPlay, etc.)
               allowsExternalPlayback={true}
            // react-native-video automatically handles media session
            // when playInBackground is true
            />
         )}

         {isMinimized ? (
            // Minimized: No SafeAreaView needed for floating PiP window
            <>
               {/* Minimized Player - Picture-in-Picture Style */}
               <Animated.View
                  style={[minimizedAnimatedStyle, styles.minimizedPiPContainer]}
                  pointerEvents="auto"
               >
                  <TouchableOpacity
                     style={styles.minimizedContainer}
                     onPress={handleExpand}
                     activeOpacity={0.9}
                  >
                     {/* Cover Image Background */}
                     {chapterCoverUri ? (
                        <Image
                           source={{ uri: chapterCoverUri }}
                           style={styles.minimizedCover}
                           contentFit="cover"
                        />
                     ) : (
                        <View style={[styles.minimizedCover, styles.minimizedCoverPlaceholder]}>
                           <Ionicons name="musical-notes" size={32} color={colors.text.secondaryDark} />
                        </View>
                     )}

                     {/* Semi-transparent Overlay for Button Visibility */}
                     <View style={styles.minimizedOverlay} />

                     {/* Centered Play/Pause Button */}
                     <View style={styles.minimizedPlayButtonContainer}>
                        <TouchableOpacity
                           onPress={(e) => {
                              e.stopPropagation();
                              handlePlayPause();
                           }}
                           style={styles.minimizedPlayButton}
                           activeOpacity={0.8}
                           disabled={isLoading}
                        >
                           {isLoading ? (
                              <ActivityIndicator
                                 size="small"
                                 color={colors.background.dark}
                              />
                           ) : (
                              <Ionicons
                                 name={isPlaying ? 'pause' : 'play'}
                                 size={32}
                                 color={colors.background.dark}
                                 style={!isPlaying ? styles.playIconOffset : undefined}
                              />
                           )}
                        </TouchableOpacity>
                     </View>

                     {/* Close Button - Top Right */}
                     <TouchableOpacity
                        onPress={(e) => {
                           e.stopPropagation();
                           handleClose();
                        }}
                        style={styles.minimizedCloseButton}
                        activeOpacity={0.7}
                     >
                        <View style={styles.minimizedCloseButtonBackground}>
                           <Ionicons
                              name="close"
                              size={18}
                              color={colors.text.dark}
                           />
                        </View>
                     </TouchableOpacity>
                  </TouchableOpacity>
               </Animated.View>
            </>
         ) : (
            // Maximized: Use SafeAreaView for full player
            <SafeAreaView edges={[]} style={styles.safeArea}>
               {/* Full Player View */}
               <Animated.View
                  style={[styles.playerContainer, fullPlayerAnimatedStyle, dragAnimatedStyle]}
                  {...panResponder.panHandlers}
               >
                  {/* Drag Handler Indicator */}
                  <View
                     style={styles.dragHandlerContainer}
                     pointerEvents="box-none"
                  >
                     <View style={styles.dragHandler} />
                  </View>

                  {/* Header with close button */}
                  <View style={styles.header}>
                     <Text style={styles.title} numberOfLines={1}>
                        {chapterMetadata?.title || 'Loading...'}
                     </Text>
                     <View style={styles.headerButtons}>
                        <TouchableOpacity
                           onPress={handleClose}
                           style={styles.closeButton}
                           activeOpacity={0.7}
                        >
                           <Ionicons name="close" size={24} color={colors.text.dark} />
                        </TouchableOpacity>
                     </View>
                  </View>

                  {/* Cover Image */}
                  {chapterCoverUri && (
                     <View style={styles.coverContainer}>
                        <Image
                           source={{ uri: chapterCoverUri }}
                           style={styles.coverImage}
                           contentFit="cover"
                        />
                     </View>
                  )}

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
                     </View>
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
                           {/* 10s Backward Button */}
                           <TouchableOpacity
                              onPress={handleBackward}
                              style={styles.seekButton}
                              activeOpacity={0.8}
                              disabled={isLoading}
                           >
                              <Ionicons
                                 name="play-back-circle"
                                 size={24}
                                 color={colors.text.dark}
                              />
                              <Text style={styles.seekButtonText}>10s</Text>
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
                                    color={colors.text.dark}
                                 />
                              ) : (
                                 <View style={styles.iconWrapper}>
                                    <Ionicons
                                       name={isPlaying ? 'pause' : 'play'}
                                       size={32}
                                       color={colors.text.dark}
                                       style={!isPlaying ? styles.playIconOffset : undefined}
                                    />
                                 </View>
                              )}
                           </TouchableOpacity>

                           {/* 10s Forward Button */}
                           <TouchableOpacity
                              onPress={handleForward}
                              style={styles.seekButton}
                              activeOpacity={0.8}
                              disabled={isLoading}
                           >
                              <Ionicons
                                 name="play-forward-circle"
                                 size={24}
                                 color={colors.text.dark}
                              />
                              <Text style={styles.seekButtonText}>10s</Text>
                           </TouchableOpacity>
                        </View>
                     )}
                  </View>
               </Animated.View>
            </SafeAreaView>
         )}
      </Animated.View>
   );
});

AudioPlayer.displayName = 'AudioPlayer';

// Tab bar height calculation - must match tab bar height in app/(tabs)/_layout.tsx
// This will be calculated dynamically in the component using useSafeAreaInsets
const getTabBarHeight = (bottomInset: number): number => {
   const tabBarBaseHeight = Platform.OS === 'ios' ? 60 : 50;
   const tabBarPaddingTop = Platform.OS === 'ios' ? 10 : 5;
   const tabBarPaddingBottom = Platform.OS === 'ios' ? 20 : 5;
   return tabBarBaseHeight + tabBarPaddingTop + tabBarPaddingBottom + bottomInset;
};

const styles = StyleSheet.create({
   container: {
      position: 'absolute',
      // bottom, left, right, width will be set dynamically based on minimized state
      // When minimized: floating PiP window in bottom-right (left not set, right set inline)
      // When maximized: full width above tab bar (left: 0, right: 0 set inline)
      // Note: left is not set in base style so it can be undefined when minimized
      backgroundColor: colors.background.darkGray,
      // zIndex and elevation set conditionally based on minimized state
      overflow: 'hidden', // Prevent content overflow during animations
   },
   safeArea: {
      flex: 1,
   },
   hiddenVideo: {
      width: 0,
      height: 0,
      position: 'absolute',
   },
   playerContainer: {
      padding: spacing.lg,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
         },
         android: {
            elevation: 5,
         },
      }),
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
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
      paddingBottom: spacing.xs,
      // Increase touchable area for better drag interaction
      minHeight: 44,
      justifyContent: 'center',
   },
   dragHandler: {
      width: 40,
      height: 4,
      backgroundColor: colors.text.secondaryDark,
      borderRadius: 2,
      opacity: 0.5,
   },
   closeButton: {
      padding: spacing.xs,
   },
   coverContainer: {
      width: 200,
      height: 200,
      alignSelf: 'center',
      marginBottom: spacing.md,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
   },
   coverImage: {
      width: '100%',
      height: '100%',
   },
   progressContainer: {
      marginBottom: spacing.lg,
   },
   progressBarWrapper: {
      marginBottom: spacing.xs,
      paddingVertical: spacing.sm, // Increase touch area
      paddingHorizontal: 8, // Add horizontal padding to accommodate handle overflow
   },
   progressBarTouchable: {
      width: '100%',
      minHeight: 44, // Minimum touch target size for better interaction
      justifyContent: 'center',
   },
   progressBarContainer: {
      position: 'relative',
      width: '100%',
      height: 4, // Match progress bar height for proper alignment
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
      height: 4,
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.sm,
      overflow: 'hidden', // Constrain progress fill within bounds
      width: '100%',
   },
   progressFill: {
      height: '100%',
      backgroundColor: colors.app.red,
      // Add a subtle inner glow effect using border
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   progressHandle: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.app.red,
      borderWidth: 2,
      borderColor: colors.text.dark,
      top: -6, // Center vertically on the progress bar (4px bar height / 2 - 8px handle radius)
      // left will be set via animated style, positioned at progress percentage minus 8px to center
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
      fontSize: typography.fontSize.sm,
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
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 80,
   },
   controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
   },
   playButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.app.red,
      justifyContent: 'center',
      alignItems: 'center',
   },
   seekButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.sm,
   },
   seekButtonText: {
      fontSize: typography.fontSize.xs,
      color: colors.text.secondaryDark,
      marginTop: spacing.xs / 2,
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
   minimizedPiPContainer: {
      width: 140, // Fixed size for PiP window
      height: 140,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
         },
         android: {
            elevation: 8,
         },
      }),
   },
   minimizedContainer: {
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: colors.background.darkGray,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
   },
   minimizedCover: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: borderRadius.lg,
      backgroundColor: colors.background.dark,
   },
   minimizedCoverPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
   },
   minimizedOverlay: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay for button visibility
      borderRadius: borderRadius.lg,
   },
   minimizedPlayButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
   },
   minimizedPlayButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
         },
         android: {
            elevation: 4,
         },
      }),
   },
   minimizedCloseButton: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
   },
   minimizedCloseButtonBackground: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark semi-transparent background
      justifyContent: 'center',
      alignItems: 'center',
   },
});

