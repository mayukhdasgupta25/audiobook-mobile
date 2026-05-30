import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, timestampMentionStyles } from '@/theme';
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
                     style={tappable ? timestampMentionStyles.tappable : timestampMentionStyles.complete}
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
                  <Text key={`${index}-${segment.value}`} style={timestampMentionStyles.typing}>
                     {segment.value}
                  </Text>
               );
            }

            return <Text key={`${index}-text`}>{segment.value}</Text>;
         })}
      </Text>
   );
};

const styles = StyleSheet.create({
   content: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      lineHeight: 22,
      marginTop: 4,
   },
});
