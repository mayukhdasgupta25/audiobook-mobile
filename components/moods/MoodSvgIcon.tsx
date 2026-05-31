import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import {
   getMoodAttributeIconComponent,
   getMoodDescriptionIconComponent,
   getMoodIconComponent,
   normalizeHexCode,
} from '@/utils/moodAssets';

export type MoodSvgIconSource = 'mood' | 'attribute' | 'description';

interface MoodSvgIconProps {
   source: MoodSvgIconSource;
   name: string;
   color: string;
   size?: number;
}

function resolveIconComponent(source: MoodSvgIconSource, name: string) {
   switch (source) {
      case 'mood':
         return getMoodIconComponent(name);
      case 'attribute':
         return getMoodAttributeIconComponent(name);
      case 'description':
         return getMoodDescriptionIconComponent(name);
   }
}

export const MoodSvgIcon: React.FC<MoodSvgIconProps> = ({
   source,
   name,
   color,
   size = 24,
}) => {
   const IconComponent = resolveIconComponent(source, name);
   const tintColor = normalizeHexCode(color);

   if (!IconComponent) {
      return (
         <View style={[styles.fallback, { width: size, height: size }]}>
            <Ionicons name="ellipse-outline" size={size * 0.75} color={colors.text.muted} />
         </View>
      );
   }

   return (
      <IconComponent
         width={size}
         height={size}
         color={tintColor}
      />
   );
};

const styles = StyleSheet.create({
   fallback: {
      justifyContent: 'center',
      alignItems: 'center',
   },
});
