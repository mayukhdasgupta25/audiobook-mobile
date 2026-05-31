import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, type SkeletonShape } from './SkeletonBox';
import { SkeletonText } from './SkeletonText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { borderRadius, spacing } from '@/theme';

interface SkeletonListItemProps {
   coverSize?: number;
   coverWidth?: number;
   coverHeight?: number;
   shape?: SkeletonShape;
   textLines?: 2 | 3;
   trailingActionSize?: number;
   showDivider?: boolean;
   count?: number;
}

export function SkeletonListItem({
   coverSize = 56,
   coverWidth,
   coverHeight,
   shape = 'square',
   textLines = 2,
   trailingActionSize,
   showDivider = false,
   count = 1,
}: SkeletonListItemProps) {
   const width = coverWidth ?? coverSize;
   const height = coverHeight ?? coverSize;
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            gap: spacing.md,
         },
         textBlock: {
            flex: 1,
            gap: spacing.xs,
         },
         subtitle: {
            marginTop: spacing.xs,
         },
         divider: {
            height: 1,
            backgroundColor: t.colors.background.input,
            marginHorizontal: spacing.md,
         },
      })
   );

   return (
      <>
         {Array.from({ length: count }).map((_, index) => (
            <View key={index}>
               <View style={styles.row}>
                  <SkeletonBox
                     shape={shape}
                     width={width}
                     height={height}
                     borderRadius={shape === 'square' ? borderRadius.md : undefined}
                  />
                  <View style={styles.textBlock}>
                     <SkeletonText width="75%" height={14} />
                     <SkeletonText width="55%" height={12} style={styles.subtitle} />
                     {textLines >= 3 ? (
                        <SkeletonText width="40%" height={10} style={styles.subtitle} />
                     ) : null}
                  </View>
                  {trailingActionSize ? (
                     <SkeletonBox shape="circle" size={trailingActionSize} />
                  ) : null}
               </View>
               {showDivider ? <View style={styles.divider} /> : null}
            </View>
         ))}
      </>
   );
}
