import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { typography } from '@/theme';
import { getTimestampMentionStyles } from '@/theme/timestampMention';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
   splitTextForAtHighlights,
   parseAtTimestampLabelToSeconds,
   type AtHighlightSegment,
} from '@/utils/commentTimestamp';

interface CommentTextWithTimestampsProps {
   content: string;
   canSeek: boolean;
   onTimestampPress: (positionSeconds: number) => void;
}

function getSecondsFromSegment(segment: AtHighlightSegment): number | null {
   if (segment.type !== 'at-complete') return null;
   return parseAtTimestampLabelToSeconds(segment.value);
}

export const CommentTextWithTimestamps: React.FC<CommentTextWithTimestampsProps> = ({
   content,
   canSeek,
   onTimestampPress,
}) => {
   const { colors } = useTheme();
   const mentionStyles = useMemo(
      () => getTimestampMentionStyles(colors),
      [colors]
   );
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         content: {
            fontSize: typography.fontSize.base,
            color: t.colors.text.secondary,
            lineHeight: 22,
            marginTop: 4,
         },
      })
   );

   const segments = useMemo(() => splitTextForAtHighlights(content), [content]);

   return (
      <Text style={styles.content}>
         {segments.map((segment, index) => {
            if (segment.type === 'at-complete') {
               const seconds = getSecondsFromSegment(segment);
               const tappable = canSeek && seconds != null;
               return (
                  <Text
                     key={`${index}-${segment.value}`}
                     style={tappable ? mentionStyles.tappable : mentionStyles.complete}
                     onPress={
                        tappable
                           ? () => onTimestampPress(seconds!)
                           : undefined
                     }
                     suppressHighlighting
                  >
                     {segment.value}
                  </Text>
               );
            }

            if (segment.type === 'at-partial' || segment.type === 'at-bare') {
               return (
                  <Text key={`${index}-${segment.value}`} style={mentionStyles.typing}>
                     {segment.value}
                  </Text>
               );
            }

            return <Text key={`${index}-text`}>{segment.value}</Text>;
         })}
      </Text>
   );
};
