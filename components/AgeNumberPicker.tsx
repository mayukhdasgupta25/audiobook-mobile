import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   Platform,
   type NativeScrollEvent,
   type NativeSyntheticEvent,
   type ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/theme';
import {
   ageFromScrollOffset,
   buildAgeRange,
   scrollOffsetForAge,
} from '@/utils/agePicker';

export const AGE_PICKER_ITEM_HEIGHT = 52;
const VISIBLE_ROWS = 5;
export const AGE_PICKER_HEIGHT = AGE_PICKER_ITEM_HEIGHT * VISIBLE_ROWS;
const WHEEL_PADDING = AGE_PICKER_ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

interface AgeNumberPickerProps {
   value: number;
   onValueChange: (age: number) => void;
   minAge: number;
   maxAge: number;
   testID?: string;
}

/**
 * iOS-style scroll wheel for selecting age in onboarding.
 */
export const AgeNumberPicker: React.FC<AgeNumberPickerProps> = ({
   value,
   onValueChange,
   minAge,
   maxAge,
   testID = 'age-number-picker',
}) => {
   const ages = useMemo(() => buildAgeRange(minAge, maxAge), [minAge, maxAge]);
   const listRef = useRef<FlatList<number>>(null);
   const lastHapticAgeRef = useRef(value);
   const isUserScrollingRef = useRef(false);
   const [highlightedAge, setHighlightedAge] = useState(value);

   const scrollToAge = useCallback(
      (age: number, animated: boolean) => {
         const clamped = Math.min(maxAge, Math.max(minAge, age));
         const offset = scrollOffsetForAge(clamped, AGE_PICKER_ITEM_HEIGHT, minAge);
         listRef.current?.scrollToOffset({ offset, animated });
         setHighlightedAge(clamped);
         lastHapticAgeRef.current = clamped;
      },
      [minAge, maxAge]
   );

   useEffect(() => {
      if (!isUserScrollingRef.current) {
         scrollToAge(value, false);
      }
   }, [value, scrollToAge]);

   const applyScrollOffset = useCallback(
      (offsetY: number, fireHaptic: boolean) => {
         const nextAge = ageFromScrollOffset(
            offsetY,
            AGE_PICKER_ITEM_HEIGHT,
            minAge,
            maxAge
         );
         setHighlightedAge(nextAge);
         onValueChange(nextAge);

         if (fireHaptic && nextAge !== lastHapticAgeRef.current) {
            lastHapticAgeRef.current = nextAge;
            void Haptics.selectionAsync();
         }
      },
      [minAge, maxAge, onValueChange]
   );

   const handleScrollEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
         isUserScrollingRef.current = false;
         applyScrollOffset(event.nativeEvent.contentOffset.y, true);
      },
      [applyScrollOffset]
   );

   const handleScrollBegin = useCallback(() => {
      isUserScrollingRef.current = true;
   }, []);

   const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
         applyScrollOffset(event.nativeEvent.contentOffset.y, false);
      },
      [applyScrollOffset]
   );

   const getItemLayout = useCallback(
      (_: ArrayLike<number> | null | undefined, index: number) => ({
         length: AGE_PICKER_ITEM_HEIGHT,
         offset: AGE_PICKER_ITEM_HEIGHT * index,
         index,
      }),
      []
   );

   const renderItem = useCallback(
      ({ item: age }: ListRenderItemInfo<number>) => {
         const distance = Math.abs(age - highlightedAge);
         const isSelected = distance === 0;
         const isAdjacent = distance === 1;

         return (
            <View style={styles.item} accessibilityElementsHidden>
               <Text
                  style={[
                     styles.itemText,
                     isAdjacent && styles.itemTextAdjacent,
                     isSelected && styles.itemTextSelected,
                     distance >= 2 && styles.itemTextDistant,
                  ]}
               >
                  {age}
               </Text>
            </View>
         );
      },
      [highlightedAge]
   );

   return (
      <View style={styles.wrapper} testID={testID}>
         <View style={styles.pickerFrame}>
            <View style={styles.selectionBand} pointerEvents="none" />
            <FlatList
               ref={listRef}
               data={ages}
               keyExtractor={(age) => String(age)}
               renderItem={renderItem}
               getItemLayout={getItemLayout}
               showsVerticalScrollIndicator={false}
               snapToInterval={AGE_PICKER_ITEM_HEIGHT}
               decelerationRate="fast"
               nestedScrollEnabled
               onScrollBeginDrag={handleScrollBegin}
               onScroll={handleScroll}
               scrollEventThrottle={16}
               onMomentumScrollEnd={handleScrollEnd}
               onScrollEndDrag={handleScrollEnd}
               contentContainerStyle={styles.listContent}
               style={styles.list}
            />
            <LinearGradient
               colors={['#000000', 'rgba(0,0,0,0)']}
               style={styles.fadeTop}
               pointerEvents="none"
            />
            <LinearGradient
               colors={['rgba(0,0,0,0)', '#000000']}
               style={styles.fadeBottom}
               pointerEvents="none"
            />
         </View>
         <Text style={styles.unitLabel}>years old</Text>
      </View>
   );
};

const styles = StyleSheet.create({
   wrapper: {
      width: '100%',
      alignItems: 'center',
   },
   pickerFrame: {
      width: '100%',
      maxWidth: 280,
      height: AGE_PICKER_HEIGHT,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.background.input,
      overflow: 'hidden',
   },
   selectionBand: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      top: WHEEL_PADDING,
      height: AGE_PICKER_ITEM_HEIGHT,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.background.highlight,
      zIndex: 1,
   },
   list: {
      flex: 1,
   },
   listContent: {
      paddingVertical: WHEEL_PADDING,
   },
   item: {
      height: AGE_PICKER_ITEM_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
   },
   itemText: {
      fontSize: typography.fontSize.lg,
      color: colors.text.secondaryDark,
      fontWeight: '500',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   itemTextAdjacent: {
      fontSize: typography.fontSize.xl,
      color: 'rgba(255, 255, 255, 0.45)',
   },
   itemTextSelected: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: '700',
      color: colors.text.dark,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-bold' },
      }),
   },
   itemTextDistant: {
      fontSize: typography.fontSize.base,
      color: 'rgba(163, 163, 163, 0.35)',
   },
   fadeTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: WHEEL_PADDING + spacing.sm,
      zIndex: 2,
   },
   fadeBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: WHEEL_PADDING + spacing.sm,
      zIndex: 2,
   },
   unitLabel: {
      marginTop: spacing.md,
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
});
