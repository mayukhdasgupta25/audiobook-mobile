import React, { useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface StarRatingProps {
   rating: number;
   maxStars?: number;
   size?: number;
   interactive?: boolean;
   onRate?: (rating: number) => void;
}

function clampRating(value: number, max: number): number {
   return Math.min(max, Math.max(0, value));
}

export const StarRating: React.FC<StarRatingProps> = ({
   rating,
   maxStars = 5,
   size = 14,
   interactive = false,
   onRate,
}) => {
   const { colors } = useTheme();
   const displayRating = clampRating(rating, maxStars);

   const handlePress = useCallback(
      (star: number) => {
         if (interactive && onRate) {
            onRate(star);
         }
      },
      [interactive, onRate]
   );

   return (
      <View style={styles.row}>
         {Array.from({ length: maxStars }, (_, i) => {
            const starIndex = i + 1;
            const filled = starIndex <= Math.round(displayRating);
            const icon = (
               <Ionicons
                  name={filled ? 'star' : 'star-outline'}
                  size={size}
                  color={colors.accent.primary}
               />
            );

            if (interactive) {
               return (
                  <TouchableOpacity
                     key={starIndex}
                     onPress={() => handlePress(starIndex)}
                     activeOpacity={0.7}
                     style={styles.starTouch}
                  >
                     {icon}
                  </TouchableOpacity>
               );
            }

            return (
               <View key={starIndex} style={styles.starTouch}>
                  {icon}
               </View>
            );
         })}
      </View>
   );
};

const styles = StyleSheet.create({
   row: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   starTouch: {
      marginRight: 2,
   },
});
