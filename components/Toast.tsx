import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
   runOnJS,
   useAnimatedStyle,
   useSharedValue,
   withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToastContext } from '@/contexts/ToastContext';
import { borderRadius, colors, spacing, typography } from '@/theme';

export function Toast() {
   const insets = useSafeAreaInsets();
   const { toast, clear } = useToastContext();
   const translateY = useSharedValue(80);
   const opacity = useSharedValue(0);

   useEffect(() => {
      if (toast?.visible) {
         translateY.value = withTiming(0, { duration: 220 });
         opacity.value = withTiming(1, { duration: 220 });
         return;
      }

      if (!toast) {
         return;
      }

      translateY.value = withTiming(80, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 }, (finished) => {
         if (finished) {
            runOnJS(clear)();
         }
      });
   }, [toast, toast?.visible, toast?.message, clear, translateY, opacity]);

   const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
   }));

   if (!toast) {
      return null;
   }

   const isError = toast.type === 'error';
   const iconName = isError ? 'alert-circle' : 'checkmark-circle';

   return (
      <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + spacing.md }]}>
         <Animated.View
            style={[
               styles.banner,
               isError ? styles.bannerError : styles.bannerSuccess,
               animatedStyle,
            ]}
         >
            <Ionicons
               name={iconName}
               size={20}
               color={isError ? colors.error : colors.accent.primary}
            />
            <Text style={styles.message} numberOfLines={3}>
               {toast.message}
            </Text>
         </Animated.View>
      </View>
   );
}

const styles = StyleSheet.create({
   host: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      zIndex: 9999,
      elevation: 9999,
   },
   banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.background.player,
      shadowColor: colors.accent.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
   },
   bannerSuccess: {},
   bannerError: {},
   message: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.text.primary,
      lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
   },
});
