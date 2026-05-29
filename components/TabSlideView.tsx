import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
   cancelAnimation,
   runOnJS,
   useAnimatedStyle,
   useSharedValue,
   withSpring,
   type SharedValue,
} from 'react-native-reanimated';
import { TAB_SLIDE_SPRING } from '@/theme/tabAnimation';

interface TabSlideViewProps {
   activeKey: string;
   tabKeys: string[];
   children: ReactNode[];
   style?: StyleProp<ViewStyle>;
   /** Called when the user swipes to a different tab */
   onTabChange?: (key: string) => void;
   /** Enable horizontal swipe between tabs. Default true */
   swipeEnabled?: boolean;
}

const SWIPE_DISTANCE_THRESHOLD_RATIO = 0.22;
const SWIPE_VELOCITY_THRESHOLD = 450;

function springToIndex(
   translateX: SharedValue<number>,
   index: number,
   width: number
): void {
   'worklet';
   cancelAnimation(translateX);
   translateX.value = withSpring(-index * width, TAB_SLIDE_SPRING);
}

/**
 * Horizontally slides between tab panels when activeKey changes or the user swipes.
 */
export function TabSlideView({
   activeKey,
   tabKeys,
   children,
   style,
   onTabChange,
   swipeEnabled = true,
}: TabSlideViewProps) {
   const [containerWidth, setContainerWidth] = useState(0);
   const translateX = useSharedValue(0);
   const dragStartX = useSharedValue(0);
   const containerWidthSV = useSharedValue(0);
   const activeIndexSV = useSharedValue(0);
   /** Skip the next external activeKey sync — gesture already animated the panel */
   const skipExternalSyncRef = useRef(false);

   const activeIndex = Math.max(0, tabKeys.indexOf(activeKey));
   const tabCount = tabKeys.length;

   useEffect(() => {
      activeIndexSV.value = activeIndex;
      if (containerWidth <= 0) return;

      if (skipExternalSyncRef.current) {
         skipExternalSyncRef.current = false;
         return;
      }

      springToIndex(translateX, activeIndex, containerWidth);
   }, [activeIndex, containerWidth, translateX, activeIndexSV]);

   const notifyTabChange = (key: string) => {
      onTabChange?.(key);
   };

   const markGestureDrivenChange = () => {
      skipExternalSyncRef.current = true;
   };

   const panGesture = Gesture.Pan()
      .enabled(swipeEnabled && tabCount > 1 && !!onTabChange)
      .activeOffsetX([-16, 16])
      .failOffsetY([-12, 12])
      .onBegin(() => {
         cancelAnimation(translateX);
         dragStartX.value = translateX.value;
      })
      .onUpdate((event) => {
         const width = containerWidthSV.value;
         if (width <= 0) return;

         const minX = -(tabCount - 1) * width;
         const nextX = dragStartX.value + event.translationX;
         translateX.value = Math.min(0, Math.max(minX, nextX));
      })
      .onEnd((event) => {
         const width = containerWidthSV.value;
         if (width <= 0) return;

         const currentIndex = activeIndexSV.value;
         let targetIndex = currentIndex;
         const threshold = width * SWIPE_DISTANCE_THRESHOLD_RATIO;

         if (
            event.translationX <= -threshold ||
            event.velocityX <= -SWIPE_VELOCITY_THRESHOLD
         ) {
            targetIndex = Math.min(tabCount - 1, currentIndex + 1);
         } else if (
            event.translationX >= threshold ||
            event.velocityX >= SWIPE_VELOCITY_THRESHOLD
         ) {
            targetIndex = Math.max(0, currentIndex - 1);
         }

         springToIndex(translateX, targetIndex, width);

         if (targetIndex !== currentIndex) {
            activeIndexSV.value = targetIndex;
            runOnJS(markGestureDrivenChange)();
            runOnJS(notifyTabChange)(tabKeys[targetIndex]);
         }
      });

   const slideStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
   }));

   return (
      <GestureDetector gesture={panGesture}>
         <View
            style={[styles.container, style]}
            onLayout={(event) => {
               const nextWidth = event.nativeEvent.layout.width;
               if (nextWidth > 0 && nextWidth !== containerWidth) {
                  setContainerWidth(nextWidth);
                  containerWidthSV.value = nextWidth;
                  cancelAnimation(translateX);
                  translateX.value = -activeIndex * nextWidth;
               }
            }}
         >
            {containerWidth > 0 ? (
               <Animated.View
                  style={[
                     styles.row,
                     { width: containerWidth * tabKeys.length },
                     slideStyle,
                  ]}
               >
                  {tabKeys.map((key, index) => (
                     <View
                        key={key}
                        style={[styles.panel, { width: containerWidth }]}
                     >
                        {children[index]}
                     </View>
                  ))}
               </Animated.View>
            ) : null}
         </View>
      </GestureDetector>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      overflow: 'hidden',
   },
   row: {
      flexDirection: 'row',
      flex: 1,
   },
   panel: {
      flex: 1,
   },
});
