import React from 'react';
import {
   View,
   Text,
   Image,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

export interface PopularStory {
   id: string;
   title: string;
   author: string;
   imageUri?: string;
   category: string;
}

interface PopularStoryItemProps {
   story: PopularStory;
   onPress: () => void;
}

/**
 * Popular story list item component
 * Displays a horizontal card with story cover, title, author, and category
 */
export const PopularStoryItem: React.FC<PopularStoryItemProps> = React.memo(
   ({ story, onPress }) => {
      return (
         <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${story.title} by ${story.author}`}
         >
            {/* Story Cover */}
            <View style={styles.imageContainer}>
               {story.imageUri ? (
                  <Image
                     source={{ uri: story.imageUri }}
                     style={styles.image}
                  />
               ) : (
                  <View style={[styles.image, styles.placeholder]}>
                     <Text style={styles.placeholderText}>
                        {story.title.charAt(0)}
                     </Text>
                  </View>
               )}
            </View>

            {/* Story Info */}
            <View style={styles.infoContainer}>
               <Text style={styles.title} numberOfLines={2}>
                  {story.title}
               </Text>
               <Text style={styles.author} numberOfLines={1}>
                  {story.author}
               </Text>
               <Text style={styles.category} numberOfLines={1}>
                  {story.category}
               </Text>
            </View>

            {/* Chevron Arrow */}
            <Ionicons
               name="chevron-forward"
               size={20}
               color={colors.text.secondaryDark}
               style={styles.chevron}
            />
         </TouchableOpacity>
      );
   }
);

PopularStoryItem.displayName = 'PopularStoryItem';

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: colors.background.dark,
   },
   imageContainer: {
      marginRight: spacing.md,
   },
   image: {
      width: 80,
      height: 120,
      borderRadius: borderRadius.md,
      resizeMode: 'cover',
   },
   placeholder: {
      backgroundColor: colors.background.darkGray,
      justifyContent: 'center',
      alignItems: 'center',
   },
   placeholderText: {
      fontSize: typography.fontSize.xl,
      color: colors.text.secondaryDark,
      fontWeight: '700',
   },
   infoContainer: {
      flex: 1,
      justifyContent: 'center',
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      marginBottom: spacing.xs,
      letterSpacing: -0.2,
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
   author: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      marginBottom: spacing.xs / 2,
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
   category: {
      fontSize: typography.fontSize.xs,
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
   chevron: {
      marginLeft: spacing.sm,
   },
});

