import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, typography, borderRadius } from '@/theme';

const CARD_WIDTH = 120;

interface PublisherCardProps {
   name: string;
   imageUri?: string;
   onPress?: () => void;
}

export const PublisherCard: React.FC<PublisherCardProps> = ({
   name,
   imageUri,
   onPress,
}) => {
   return (
      <TouchableOpacity
         style={styles.card}
         onPress={onPress}
         activeOpacity={0.85}
         disabled={!onPress}
      >
         {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.logo} contentFit="cover" />
         ) : (
            <View style={[styles.logo, styles.placeholder]}>
               <Text style={styles.placeholderLetter}>{name.charAt(0)}</Text>
            </View>
         )}
         <Text style={styles.name} numberOfLines={2}>
            {name}
         </Text>
      </TouchableOpacity>
   );
};

export const PUBLISHER_CARD_WIDTH = CARD_WIDTH;

const styles = StyleSheet.create({
   card: {
      width: CARD_WIDTH,
      marginRight: spacing.sm,
   },
   logo: {
      width: CARD_WIDTH,
      height: CARD_WIDTH,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.background.input,
   },
   placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
   },
   placeholderLetter: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: '700',
      color: colors.text.muted,
   },
   name: {
      marginTop: spacing.xs,
      fontSize: typography.fontSize.sm,
      fontWeight: '600',
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
});
