import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
   Easing,
   useAnimatedStyle,
   useSharedValue,
   withRepeat,
   withTiming,
} from 'react-native-reanimated';
import { borderRadius, colors } from '@/theme';

interface SkeletonBoxProps {
   width?: number | `${number}%`;
   height?: number;
   borderRadius?: number;
   style?: ViewStyle;
}

export function SkeletonBox({
   width = '100%',
   height = 16,
   borderRadius: radius = borderRadius.sm,
   style,
}: SkeletonBoxProps) {
   const opacity = useSharedValue(0.45);

   useEffect(() => {
      opacity.value = withRepeat(
         withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
         -1,
         true
      );
   }, [opacity]);

   const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
   }));

   return (
      <Animated.View
         style={[
            styles.box,
            { width, height, borderRadius: radius },
            animatedStyle,
            style,
         ]}
      />
   );
}

const styles = StyleSheet.create({
   box: {
      backgroundColor: colors.background.input,
   },
});
