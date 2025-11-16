import React, { useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
   Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface StoryCardWithShareProps {
   title: string;
   imageUri?: string;
   badge?: string;
   onPress?: () => void;
   cardWidth?: number;
   shareMessage?: string;
}

/**
 * Story card component with share button overlay
 * Extends ContentCard functionality with share feature
 */
const StoryCardWithShareComponent: React.FC<StoryCardWithShareProps> = ({
   title,
   imageUri,
   badge,
   onPress,
   cardWidth = 140,
   shareMessage,
}) => {
   // Memoize share handler to prevent re-renders
   const handleShare = useCallback(async () => {
      try {
         await Share.share({
            message: shareMessage || `Check out this story: ${title}`,
            title: title,
         });
      } catch (error) {
         console.error('Error sharing:', error);
      }
   }, [shareMessage, title]);

   return (
      <View style={[styles.container, { width: cardWidth }]}>
         {/* Main card content */}
         <TouchableOpacity
            onPress={onPress}
            style={styles.cardContent}
            activeOpacity={0.8}
         >
            <View style={styles.imageContainer}>
               {imageUri ? (
                  <Image
                     source={{ uri: imageUri }}
                     style={styles.image}
                     contentFit="cover"
                     transition={200}
                     cachePolicy="memory-disk" // Cache images for better performance
                     priority="normal"
                  />
               ) : (
                  <View style={[styles.image, styles.placeholder]}>
                     <Text style={styles.placeholderText}>{title.charAt(0)}</Text>
                  </View>
               )}

               {/* Badge overlay (e.g., TOP 10) */}
               {badge && (
                  <View style={styles.badge}>
                     <Text style={styles.badgeText}>{badge}</Text>
                  </View>
               )}

               {/* Gradient overlay for share button */}
               <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.gradient}
               >
                  <TouchableOpacity
                     style={styles.shareButton}
                     onPress={handleShare}
                     activeOpacity={0.7}
                  >
                     <Ionicons
                        name="paper-plane-outline"
                        size={16}
                        color={colors.text.dark}
                        style={styles.shareIcon}
                     />
                     <Text style={styles.shareText}>Share</Text>
                  </TouchableOpacity>
               </LinearGradient>
            </View>
         </TouchableOpacity>
      </View>
   );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const StoryCardWithShare = React.memo(StoryCardWithShareComponent);

const styles = StyleSheet.create({
   container: {
      marginRight: spacing.sm,
   },
   cardContent: {
      width: '100%',
   },
   imageContainer: {
      position: 'relative',
      width: '100%',
      aspectRatio: 0.7, // Portrait aspect ratio
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      backgroundColor: colors.background.darkGray,
   },
   image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
   },
   placeholder: {
      backgroundColor: colors.background.darkGray,
      justifyContent: 'center',
      alignItems: 'center',
   },
   placeholderText: {
      fontSize: typography.fontSize['2xl'],
      color: colors.text.secondaryDark,
      fontWeight: '700',
   },
   badge: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      backgroundColor: colors.app.red,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
   },
   badgeText: {
      color: colors.text.dark,
      fontSize: typography.fontSize.xs,
      fontWeight: '700',
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
   gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      justifyContent: 'flex-end',
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
   },
   shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   shareIcon: {
      marginRight: spacing.xs,
   },
   shareText: {
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
});

