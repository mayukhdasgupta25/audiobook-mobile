/**
 * Audio Player Component
 * Displays audio player UI with playback controls and progress
 */

import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
   ActivityIndicator,
   Dimensions,
} from 'react-native';
import Animated, {
   useAnimatedStyle,
   useSharedValue,
   withTiming,
   withSpring,
   Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Video from 'react-native-video';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { play, pause, setVisible, setMinimized } from '@/store/player';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useMediaSession } from '@/hooks/useMediaSession';
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
   } = useSelector((state: RootState) => state.player);

   // Animation shared values
   const translateY = useSharedValue(SCREEN_HEIGHT);
   const opacity = useSharedValue(0);
   const fullPlayerOpacity = useSharedValue(0);
   const minimizedOpacity = useSharedValue(0);
   const fullPlayerScale = useSharedValue(0.95);
   const minimizedScale = useSharedValue(0.95);
   const isMountedRef = useRef(false);
   const previousVisibleRef = useRef(false);
   const previousMinimizedRef = useRef(false);
   const progressBarWidthRef = useRef(0);
   const progressBarWrapperRef = useRef<View | null>(null);
   const wrapperXRef = useRef(0);
   const wrapperYRef = useRef(0);
   const wrapperWidthRef = useRef(0);
   const wrapperHeightRef = useRef(0);

   // State for dragging animation
   const [isDragging, setIsDragging] = useState(false);
   const [dragProgress, setDragProgress] = useState(0);
   const dragProgressValue = useSharedValue(0);

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

   // Calculate total progress (absolute position / total duration)
   const totalProgress = useMemo(() => {
      if (totalDuration === 0) return 0;
      return playbackPosition / totalDuration;
   }, [playbackPosition, totalDuration]);

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

   // Track if user is actually dragging vs just tapping
   const isDraggingRef = useRef(false);
   const dragStartXRef = useRef(0);

   // Helper function to check if touch is within progress bar bounds
   const isTouchWithinBounds = (pageX: number, pageY: number): boolean => {
      const x = wrapperXRef.current;
      const y = wrapperYRef.current;
      const width = wrapperWidthRef.current;
      const height = wrapperHeightRef.current;

      // Check if touch is within the progress bar area (with some vertical tolerance)
      return pageX >= x && pageX <= x + width && pageY >= y - 20 && pageY <= y + height + 20;
   };

   // Helper function to convert pageX to relative position within progress bar
   const pageXToRelativeX = (pageX: number): number => {
      const x = wrapperXRef.current;
      // Account for horizontal padding (8px on each side)
      const relativeX = pageX - x - 8;
      return Math.max(0, Math.min(progressBarWidthRef.current, relativeX));
   };

   // Handle touch start - works reliably on both emulator and real devices
   const handleTouchStart = (evt: any) => {
      if (progressBarWidthRef.current === 0 || totalDuration === 0) return;

      const nativeEvent = evt.nativeEvent;
      // Get absolute screen coordinates to check bounds
      const pageX = nativeEvent.pageX ?? nativeEvent.touches?.[0]?.pageX ?? 0;
      const pageY = nativeEvent.pageY ?? nativeEvent.touches?.[0]?.pageY ?? 0;

      // Only allow touch start if within progress bar bounds
      if (!isTouchWithinBounds(pageX, pageY)) {
         return;
      }

      // locationX is relative to the touch target and works reliably on real devices
      const locationX = nativeEvent.locationX ?? nativeEvent.touches?.[0]?.locationX ?? 0;
      dragStartXRef.current = locationX;
      isDraggingRef.current = false;
      // Initialize drag progress with current progress to prevent jump
      setDragProgress(totalProgress);
      dragProgressValue.value = totalProgress;
   };

   // Handle touch move - for dragging
   const handleTouchMove = (evt: any) => {
      if (progressBarWidthRef.current === 0 || totalDuration === 0) return;

      const nativeEvent = evt.nativeEvent;
      // Get absolute screen coordinates
      const pageX = nativeEvent.pageX ?? nativeEvent.touches?.[0]?.pageX ?? 0;
      const pageY = nativeEvent.pageY ?? nativeEvent.touches?.[0]?.pageY ?? 0;

      // Get relative position for initial drag detection
      const locationX = nativeEvent.locationX ?? nativeEvent.touches?.[0]?.locationX ?? 0;

      // Check if touch is within progress bar bounds
      const withinBounds = isTouchWithinBounds(pageX, pageY);

      // If we're already dragging but touch moved outside bounds, cancel drag
      if (isDraggingRef.current && !withinBounds) {
         setIsDragging(false);
         setDragging(false);
         isDraggingRef.current = false;
         return;
      }

      // Check if this is actually a drag (movement > threshold) and within bounds
      const moveDistance = Math.abs(locationX - dragStartXRef.current);
      if (moveDistance > 3 && !isDraggingRef.current && withinBounds) {
         // Start dragging - prevent progress updates from interfering
         isDraggingRef.current = true;
         setIsDragging(true);
         setDragging(true); // Tell hook to skip progress updates
         setDragProgress(totalProgress);
         dragProgressValue.value = totalProgress;
      }

      if (isDraggingRef.current && withinBounds) {
         // Convert pageX to relative position within progress bar
         const relativeX = pageXToRelativeX(pageX);
         // Calculate percentage directly from relativeX
         const percentage = Math.max(0, Math.min(1, relativeX / progressBarWidthRef.current));
         setDragProgress(percentage);
         dragProgressValue.value = percentage;
      }
   };

   // Handle touch end - seek to final position
   const handleTouchEnd = (evt: any) => {
      if (progressBarWidthRef.current === 0 || totalDuration === 0) {
         setIsDragging(false);
         setDragging(false); // Re-enable progress updates
         isDraggingRef.current = false;
         return;
      }

      const nativeEvent = evt.nativeEvent;
      // Get absolute screen coordinates
      const pageX = nativeEvent.pageX ?? nativeEvent.changedTouches?.[0]?.pageX ?? 0;
      const pageY = nativeEvent.pageY ?? nativeEvent.changedTouches?.[0]?.pageY ?? 0;

      // Only seek if touch ended within bounds and we were dragging
      const withinBounds = isTouchWithinBounds(pageX, pageY);

      if (isDraggingRef.current && withinBounds) {
         // Convert pageX to relative position within progress bar
         const relativeX = pageXToRelativeX(pageX);
         // Calculate final position and seek
         const percentage = Math.max(0, Math.min(1, relativeX / progressBarWidthRef.current));
         const targetTime = percentage * totalDuration;

         // Re-enable progress updates before seeking
         setDragging(false);
         isDraggingRef.current = false;

         // Seek to the target time
         seekToTime(targetTime);
      } else {
         // Touch ended outside bounds or wasn't dragging - just cancel
         setDragging(false);
         isDraggingRef.current = false;
      }

      // Clear drag state after a brief delay to allow smooth transition
      setTimeout(() => {
         setIsDragging(false);
         setDragProgress(0);
      }, 50);
   };

   // Handle touch cancel
   const handleTouchCancel = () => {
      setIsDragging(false);
      setDragging(false); // Re-enable progress updates
      setDragProgress(0);
      isDraggingRef.current = false;
   };

   // Animated style for progress fill during drag
   const dragProgressAnimatedStyle = useAnimatedStyle(() => {
      return {
         width: `${dragProgressValue.value * 100}%`,
      };
   });

   // Animated style for progress handle position during drag
   const dragHandleAnimatedStyle = useAnimatedStyle(() => {
      // Clamp the progress value to ensure handle stays within bounds (0 to 1)
      const clampedProgress = Math.max(0, Math.min(1, dragProgressValue.value));
      // Position at percentage, then translate by -8px (half handle width) to center it
      return {
         left: `${clampedProgress * 100}%`,
         transform: [{ translateX: -8 }], // Center the handle (half of 16px width)
      };
   });

   // Animated style for progress handle position when not dragging
   const progressHandleAnimatedStyle = useAnimatedStyle(() => {
      // Clamp the progress value to ensure handle stays within bounds (0 to 1)
      const clampedProgress = Math.max(0, Math.min(1, totalProgress));
      return {
         left: `${clampedProgress * 100}%`,
         transform: [{ translateX: -8 }], // Center the handle (half of 16px width)
      };
   });

   // Get chapter cover image URI
   const chapterCoverUri = useMemo(() => {
      if (!chapterMetadata?.coverImage) return undefined;
      return `${apiConfig.baseURL}${chapterMetadata.coverImage}`;
   }, [chapterMetadata?.coverImage]);

   // Handle play/pause toggle
   const handlePlayPause = () => {
      if (isPlaying) {
         dispatch(pause());
      } else {
         dispatch(play());
      }
   };

   // Handle close
   const handleClose = () => {
      dispatch(setVisible(false));
   };

   // Handle minimize
   const handleMinimize = () => {
      dispatch(setMinimized(true));
   };

   // Handle expand
   const handleExpand = () => {
      dispatch(setMinimized(false));
   };

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
            translateY.value = 0;
            opacity.value = 1;
            fullPlayerOpacity.value = isMinimized ? 0 : 1;
            minimizedOpacity.value = isMinimized ? 1 : 0;
            fullPlayerScale.value = isMinimized ? 0.95 : 1;
            minimizedScale.value = isMinimized ? 1 : 0.95;
         } else {
            translateY.value = SCREEN_HEIGHT;
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
            // Opening animation - set initial state for minimize/maximize views
            fullPlayerOpacity.value = isMinimized ? 0 : 1;
            minimizedOpacity.value = isMinimized ? 1 : 0;
            fullPlayerScale.value = isMinimized ? 0.95 : 1;
            minimizedScale.value = isMinimized ? 1 : 0.95;

            // Opening animation
            translateY.value = withTiming(0, {
               duration: 350,
               easing: Easing.out(Easing.ease),
            });
            opacity.value = withTiming(1, {
               duration: 350,
               easing: Easing.out(Easing.ease),
            });
         } else {
            // Closing animation
            translateY.value = withTiming(SCREEN_HEIGHT, {
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
         if (isMinimized) {
            // Minimizing animation
            fullPlayerOpacity.value = withSpring(0, {
               damping: 15,
               stiffness: 150,
            });
            fullPlayerScale.value = withSpring(0.95, {
               damping: 15,
               stiffness: 150,
            });
            minimizedOpacity.value = withSpring(1, {
               damping: 15,
               stiffness: 150,
            });
            minimizedScale.value = withSpring(1, {
               damping: 15,
               stiffness: 150,
            });
         } else {
            // Maximizing animation
            minimizedOpacity.value = withSpring(0, {
               damping: 15,
               stiffness: 150,
            });
            minimizedScale.value = withSpring(0.95, {
               damping: 15,
               stiffness: 150,
            });
            fullPlayerOpacity.value = withSpring(1, {
               damping: 15,
               stiffness: 150,
            });
            fullPlayerScale.value = withSpring(1, {
               damping: 15,
               stiffness: 150,
            });
         }
         previousMinimizedRef.current = isMinimized;
      }
   }, [isVisible, isMinimized, translateY, opacity, fullPlayerOpacity, minimizedOpacity, fullPlayerScale, minimizedScale]);

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
         transform: [{ scale: fullPlayerScale.value }],
      };
   });

   const minimizedAnimatedStyle = useAnimatedStyle(() => {
      return {
         opacity: minimizedOpacity.value,
         transform: [{ scale: minimizedScale.value }],
      };
   });

   // Don't render if not visible or no chapter or no playlist URI
   if (!isVisible || !currentChapterId || !masterPlaylistUri) {
      return null;
   }

   return (
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
         <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* Hidden Video component for audio playback */}
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
               /* Minimized Player Bar */
               <Animated.View style={minimizedAnimatedStyle}>
                  <TouchableOpacity
                     style={styles.minimizedContainer}
                     onPress={handleExpand}
                     activeOpacity={0.9}
                  >
                     <View style={styles.minimizedContent}>
                        {/* Cover Thumbnail */}
                        {chapterCoverUri && (
                           <Image
                              source={{ uri: chapterCoverUri }}
                              style={styles.minimizedCover}
                              contentFit="cover"
                           />
                        )}

                        {/* Title and Progress */}
                        <View style={styles.minimizedInfo}>
                           <Text style={styles.minimizedTitle} numberOfLines={1}>
                              {chapterMetadata?.title || 'Loading...'}
                           </Text>
                           <View style={styles.minimizedProgressBar}>
                              <View
                                 style={[
                                    styles.minimizedProgressFill,
                                    { width: `${totalProgress * 100}%` },
                                 ]}
                              />
                           </View>
                        </View>

                        {/* Play/Pause Button */}
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
                                 color={colors.text.dark}
                              />
                           ) : (
                              <View style={styles.iconWrapper}>
                                 <Ionicons
                                    name={isPlaying ? 'pause' : 'play'}
                                    size={20}
                                    color={colors.text.dark}
                                    style={!isPlaying ? styles.playIconOffset : undefined}
                                 />
                              </View>
                           )}
                        </TouchableOpacity>

                        {/* Expand Button */}
                        <TouchableOpacity
                           onPress={(e) => {
                              e.stopPropagation();
                              handleExpand();
                           }}
                           style={styles.minimizedExpandButton}
                           activeOpacity={0.7}
                        >
                           <Ionicons
                              name="chevron-up"
                              size={20}
                              color={colors.text.dark}
                           />
                        </TouchableOpacity>

                        {/* Close Button */}
                        <TouchableOpacity
                           onPress={(e) => {
                              e.stopPropagation();
                              handleClose();
                           }}
                           style={styles.minimizedCloseButton}
                           activeOpacity={0.7}
                        >
                           <Ionicons
                              name="close"
                              size={20}
                              color={colors.text.dark}
                           />
                        </TouchableOpacity>
                     </View>
                  </TouchableOpacity>
               </Animated.View>
            ) : (
               /* Full Player View */
               <Animated.View style={[styles.playerContainer, fullPlayerAnimatedStyle]}>
                  {/* Header with minimize and close buttons */}
                  <View style={styles.header}>
                     <Text style={styles.title} numberOfLines={1}>
                        {chapterMetadata?.title || 'Loading...'}
                     </Text>
                     <View style={styles.headerButtons}>
                        <TouchableOpacity
                           onPress={handleMinimize}
                           style={styles.minimizeButton}
                           activeOpacity={0.7}
                        >
                           <Ionicons
                              name="chevron-down"
                              size={24}
                              color={colors.text.dark}
                           />
                        </TouchableOpacity>
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
                           onTouchStart={handleTouchStart}
                           onTouchMove={handleTouchMove}
                           onTouchEnd={handleTouchEnd}
                           onTouchCancel={handleTouchCancel}
                           collapsable={false}
                           pointerEvents="box-only"
                        >
                           <View style={styles.progressBarContainer}>
                              <View style={styles.progressBar}>
                                 {isDragging ? (
                                    <Animated.View
                                       style={[
                                          styles.progressFill,
                                          dragProgressAnimatedStyle,
                                       ]}
                                    />
                                 ) : (
                                    <View
                                       style={[
                                          styles.progressFill,
                                          { width: `${totalProgress * 100}%` },
                                       ]}
                                    />
                                 )}
                              </View>
                              {isDragging ? (
                                 <Animated.View
                                    style={[
                                       styles.progressHandle,
                                       dragHandleAnimatedStyle,
                                    ]}
                                 />
                              ) : (
                                 <Animated.View
                                    style={[
                                       styles.progressHandle,
                                       progressHandleAnimatedStyle,
                                    ]}
                                 />
                              )}
                           </View>
                        </View>
                     </View>
                     <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>
                           {isDragging
                              ? formatDuration(dragProgress * totalDuration)
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
                                 name="play-back-outline"
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
                                 name="play-forward-outline"
                                 size={24}
                                 color={colors.text.dark}
                              />
                              <Text style={styles.seekButtonText}>10s</Text>
                           </TouchableOpacity>
                        </View>
                     )}
                  </View>
               </Animated.View>
            )}
         </SafeAreaView>
      </Animated.View>
   );
});

AudioPlayer.displayName = 'AudioPlayer';

// Tab bar height constants - must match tab bar height in app/(tabs)/_layout.tsx
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 90 : 70;

const styles = StyleSheet.create({
   container: {
      position: 'absolute',
      bottom: TAB_BAR_HEIGHT, // Position above tab bar instead of covering it
      left: 0,
      right: 0,
      backgroundColor: colors.background.darkGray,
      zIndex: 1000, // Ensure AudioPlayer sits on top of bottom navigation bar
      elevation: 1000, // Android elevation to ensure it's above tab bar
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
   minimizeButton: {
      padding: spacing.xs,
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
   minimizedContainer: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background.darkGray,
      borderTopWidth: 1,
      borderTopColor: colors.background.dark,
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
         },
         android: {
            elevation: 3,
         },
      }),
   },
   minimizedContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
   },
   minimizedCover: {
      width: 50,
      height: 50,
      borderRadius: borderRadius.sm,
   },
   minimizedInfo: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing.xs,
   },
   minimizedTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: '600',
      color: colors.text.dark,
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
   minimizedProgressBar: {
      height: 2,
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.sm,
      overflow: 'hidden',
   },
   minimizedProgressFill: {
      height: '100%',
      backgroundColor: colors.app.red,
   },
   minimizedPlayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.app.red,
      justifyContent: 'center',
      alignItems: 'center',
   },
   iconWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
   },
   playIconOffset: {
      marginLeft: 1, // Slight offset to visually center the play triangle
   },
   minimizedCloseButton: {
      padding: spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
   },
   minimizedExpandButton: {
      padding: spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
   },
});

