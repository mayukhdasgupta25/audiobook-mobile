import React, { useMemo } from 'react';
import {
   View,
   Text,
   TouchableOpacity,
   StyleSheet,
   Dimensions,
   Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_WIDTH * 1.4; // Aspect ratio for hero section

interface HeroSectionProps {
   title?: string;
   languages?: string[];
   posterUri?: string;
   onPlayPress?: () => void;
   onMyListPress?: () => void;
}

/**
 * Hero section component with large poster, title, and action buttons
 * Modern hero design with gradient overlay
 */
const HeroSectionComponent: React.FC<HeroSectionProps> = ({
   title = 'BARAMULLA',
   languages = ['Hindi', 'English', 'Tamil', 'Telugu'],
   posterUri,
   onPlayPress,
   onMyListPress,
}) => {
   // Memoize languages string to avoid recalculating on every render
   const languagesText = useMemo(() => {
      return languages.join(', ');
   }, [languages]);

   return (
      <View style={styles.container}>
         {/* Poster Image */}
         <View style={styles.posterContainer}>
            {posterUri ? (
               <Image
                  source={{ uri: posterUri }}
                  style={styles.poster}
                  contentFit="cover"
                  transition={300}
                  cachePolicy="memory-disk" // Cache hero images for better performance
                  priority="high" // High priority for hero section (above-the-fold)
               />
            ) : (
               <View style={[styles.poster, styles.posterPlaceholder]}>
                  <Ionicons name="film-outline" size={64} color={colors.neutral[600]} />
               </View>
            )}

            {/* Gradient overlay for better text readability */}
            <LinearGradient
               colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
               locations={[0, 0.5, 1]}
               style={styles.gradient}
            />

            {/* App logo placeholder */}
            <View style={styles.appLogo}>
               <Text style={styles.appLogoText}>A</Text>
            </View>
         </View>

         {/* Content overlay */}
         <View style={styles.contentOverlay}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.languages}>
               Watch in {languagesText}
            </Text>

            {/* Action buttons */}
            <View style={styles.actionsContainer}>
               <TouchableOpacity
                  onPress={onPlayPress}
                  style={styles.playButton}
                  activeOpacity={0.8}
               >
                  <Ionicons name="play" size={20} color={colors.background.dark} />
                  <Text style={styles.playButtonText}>Play</Text>
               </TouchableOpacity>

               <TouchableOpacity
                  onPress={onMyListPress}
                  style={styles.myListButton}
                  activeOpacity={0.8}
               >
                  <Ionicons name="add" size={20} color={colors.text.dark} />
                  <Text style={styles.myListButtonText}>My List</Text>
               </TouchableOpacity>
            </View>
         </View>
      </View>
   );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const HeroSection = React.memo(HeroSectionComponent);

const styles = StyleSheet.create({
   container: {
      width: SCREEN_WIDTH,
      height: HERO_HEIGHT,
      position: 'relative',
      backgroundColor: colors.background.dark,
   },
   posterContainer: {
      width: '100%',
      height: '100%',
      position: 'relative',
   },
   poster: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
   },
   posterPlaceholder: {
      backgroundColor: colors.background.darkGray,
      justifyContent: 'center',
      alignItems: 'center',
   },
   gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60%',
   },
   appLogo: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      width: 32,
      height: 32,
      backgroundColor: colors.app.red,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.sm,
   },
   appLogoText: {
      color: colors.text.dark,
      fontSize: typography.fontSize.lg,
      fontWeight: '800',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '800',
         },
         android: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
         },
      }),
   },
   contentOverlay: {
      position: 'absolute',
      bottom: spacing.xl,
      left: spacing.md,
      right: spacing.md,
   },
   title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: '700',
      color: colors.text.dark,
      marginBottom: spacing.sm,
      letterSpacing: -0.5,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '700',
         },
         android: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
         },
      }),
   },
   languages: {
      fontSize: typography.fontSize.sm,
      color: colors.text.dark,
      marginBottom: spacing.md,
      opacity: 0.9,
   },
   actionsContainer: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
   },
   playButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.text.dark,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
   },
   playButtonText: {
      color: colors.background.dark,
      fontSize: typography.fontSize.base,
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
   myListButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.darkGray,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
   },
   myListButtonText: {
      color: colors.text.dark,
      fontSize: typography.fontSize.base,
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
});

