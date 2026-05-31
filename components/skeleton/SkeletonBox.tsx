import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
   Easing,
   useAnimatedStyle,
   useSharedValue,
   withRepeat,
   withTiming,
} from 'react-native-reanimated';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius } from '@/theme';

export type SkeletonShape = 'rectangle' | 'square' | 'circle';

interface SkeletonBoxProps {
   width?: number | `${number}%`;
   height?: number;
   borderRadius?: number;
   /** When set, derives dimensions and radius from shape rules. */
   shape?: SkeletonShape;
   /** Used with square/circle when width/height omitted. */
   size?: number;
   style?: ViewStyle;
}

function resolveSkeletonDimensions(props: SkeletonBoxProps): {
   width: number | `${number}%`;
   height: number;
   radius: number;
} {
   const {
      width = '100%',
      height = 16,
      borderRadius: radiusProp,
      shape = 'rectangle',
      size,
   } = props;

   if (shape === 'circle') {
      const circleSize = size ?? (typeof width === 'number' ? width : height);
      return {
         width: circleSize,
         height: circleSize,
         radius: circleSize / 2,
      };
   }

   if (shape === 'square') {
      const squareSize = size ?? (typeof width === 'number' ? width : height);
      return {
         width: squareSize,
         height: squareSize,
         radius: radiusProp ?? borderRadius.md,
      };
   }

   return {
      width,
      height,
      radius: radiusProp ?? borderRadius.sm,
   };
}

export function SkeletonBox(props: SkeletonBoxProps) {
   const { width, height, radius } = resolveSkeletonDimensions(props);
   const opacity = useSharedValue(0.45);
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         box: {
            backgroundColor: t.colors.background.input,
         },
      })
   );

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
            props.style,
         ]}
      />
   );
}
