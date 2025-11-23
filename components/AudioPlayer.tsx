/**
 * Audio Player Component
 * Displays audio player UI with playback controls and progress
 */

import React, { useMemo, useEffect, useRef } from 'react';
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
      currentSegmentIndex,
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

   // Get playlist data for current chapter
   const playlistData = useSelector((state: RootState) =>
      currentChapterId
         ? state.streaming.playlistsByChapterId[currentChapterId]
         : null
   );

   // Use audio player hook
   const {
      videoRef,
      currentSegmentUri,
      handleProgress,
      handleEnd,
      handleLoad,
      handleError,
      handleSeek,
   } = useAudioPlayer();

   // Calculate total progress
   const totalProgress = useMemo(() => {
      if (totalDuration === 0) return 0;
      // Calculate total progress across all segments
      let totalElapsed = 0;
      for (let i = 0; i < currentSegmentIndex; i++) {
         const segment = playlistData?.playlist.segments[i];
         if (segment) {
            totalElapsed += segment.duration;
         }
      }
      totalElapsed += playbackPosition;
      return totalElapsed / totalDuration;
   }, [playlistData, currentSegmentIndex, playbackPosition, totalDuration]);

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

   // Calculate elapsed time for display
   const elapsedTime = useMemo(() => {
      if (!playlistData) return 0;
      return Math.floor(
         playlistData.playlist.segments
            .slice(0, currentSegmentIndex)
            .reduce((sum, s) => sum + s.duration, 0) + playbackPosition
      );
   }, [playlistData, currentSegmentIndex, playbackPosition]);

   // Calculate total time for display
   const totalTime = useMemo(() => {
      if (!playlistData) return 0;
      return playlistData.playlist.segments.reduce((sum, s) => sum + s.duration, 0);
   }, [playlistData]);

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

   // Don't render if not visible or no chapter
   if (!isVisible || !currentChapterId || !currentSegmentUri) {
      return null;
   }

   return (
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
         <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* Hidden Video component for audio playback */}
            {currentSegmentUri && (
               <Video
                  ref={videoRef}
                  source={{ uri: currentSegmentUri }}
                  paused={!isPlaying}
                  onProgress={handleProgress}
                  onEnd={handleEnd}
                  onLoad={handleLoad}
                  onError={handleError}
                  style={styles.hiddenVideo}
                  ignoreSilentSwitch="ignore"
                  playInBackground={true}
                  playWhenInactive={true}
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
                     <View style={styles.progressBar}>
                        <View
                           style={[
                              styles.progressFill,
                              { width: `${totalProgress * 100}%` },
                           ]}
                        />
                     </View>
                     <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>
                           {formatDuration(elapsedTime)}
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

const styles = StyleSheet.create({
   container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background.darkGray,
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
   progressBar: {
      height: 4,
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.sm,
      overflow: 'hidden',
      marginBottom: spacing.xs,
   },
   progressFill: {
      height: '100%',
      backgroundColor: colors.app.red,
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
   minimizedExpandButton: {
      padding: spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
   },
});

