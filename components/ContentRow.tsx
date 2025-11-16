import React, { useCallback, useMemo } from 'react';
import {
   View,
   Text,
   ScrollView,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { ContentCard } from './ContentCard';
import { colors, spacing, typography } from '@/theme';

export interface ContentItem {
   id: string;
   title: string;
   imageUri?: string;
   badge?: string;
}

interface ContentRowProps {
   title: string;
   items: ContentItem[];
   showMyListLink?: boolean;
   onItemPress?: (item: ContentItem) => void;
   onMyListPress?: () => void;
   cardWidth?: number;
}

/**
 * Memoized item component to prevent re-renders when parent updates
 * This ensures each card only re-renders when its own props change
 */
const MemoizedContentCard = React.memo<{
   item: ContentItem;
   cardWidth: number;
   onPress: (item: ContentItem) => void;
}>(({ item, cardWidth, onPress }) => {
   const handlePress = useCallback(() => {
      onPress(item);
   }, [item, onPress]);

   return (
      <ContentCard
         title={item.title}
         imageUri={item.imageUri}
         badge={item.badge}
         onPress={handlePress}
         cardWidth={cardWidth}
      />
   );
}, (prevProps, nextProps) => {
   // Custom comparison function for better performance
   return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title &&
      prevProps.item.imageUri === nextProps.item.imageUri &&
      prevProps.item.badge === nextProps.item.badge &&
      prevProps.cardWidth === nextProps.cardWidth &&
      prevProps.onPress === nextProps.onPress
   );
});

/**
 * Horizontal scrollable content row component
 * Displays a section title and scrollable cards
 */
const ContentRowComponent: React.FC<ContentRowProps> = ({
   title,
   items,
   showMyListLink = false,
   onItemPress,
   onMyListPress,
   cardWidth = 140,
}) => {
   // Memoize items to prevent recreation on every render
   const memoizedItems = useMemo(() => items, [items]);

   return (
      <View style={styles.container}>
         {/* Section header */}
         <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {showMyListLink && (
               <TouchableOpacity onPress={onMyListPress} activeOpacity={0.7}>
                  <Text style={styles.myListLink}>My List {'>'}</Text>
               </TouchableOpacity>
            )}
         </View>

         {/* Horizontal scrollable content */}
         <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            removeClippedSubviews={true} // Optimize scrolling performance
            initialNumToRender={5} // Render only first 5 items initially
            maxToRenderPerBatch={3} // Render 3 items per batch
            windowSize={5} // Keep 5 screens worth of items in memory
         >
            {memoizedItems.map((item) => (
               <MemoizedContentCard
                  key={item.id}
                  item={item}
                  cardWidth={cardWidth}
                  onPress={onItemPress || (() => { })}
               />
            ))}
         </ScrollView>
      </View>
   );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const ContentRow = React.memo(ContentRowComponent);

const styles = StyleSheet.create({
   container: {
      marginBottom: spacing.lg,
      backgroundColor: colors.background.dark,
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
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
   myListLink: {
      fontSize: typography.fontSize.sm,
      color: colors.text.dark,
      fontWeight: '500',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   scrollContent: {
      paddingHorizontal: spacing.md,
   },
});

