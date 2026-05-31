import React from 'react';
import { ViewStyle } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

interface SkeletonTextProps {
   width?: number | `${number}%`;
   height?: number;
   style?: ViewStyle;
}

export function SkeletonText({
   width = '70%',
   height = 14,
   style,
}: SkeletonTextProps) {
   return (
      <SkeletonBox
         width={width}
         height={height}
         borderRadius={height / 2}
         style={style}
      />
   );
}
