import { useState, useCallback, useMemo } from 'react';
import {
   hasBareAtTrigger,
   getTrailingPartialAtDigits,
   getTimestampSuggestions,
   applyTimestampAt,
   applyTimestampSuggestionAt,
   removeTrailingBareAt,
   extractLastAtTimestampSeconds,
   getCommentMetaFromText,
} from '@/utils/commentTimestamp';

interface UseCommentTimestampAtOptions {
   audiobookId: string;
   playerAudiobookId: string | null;
   playbackPosition: number;
}

export function useCommentTimestampAt({
   audiobookId,
   playerAudiobookId,
   playbackPosition,
}: UseCommentTimestampAtOptions) {
   const [text, setText] = useState('');
   const [timestampPosition, setTimestampPosition] = useState<number | null>(null);

   const canUsePlayback = playerAudiobookId === audiobookId;
   const currentPosition = canUsePlayback ? Math.floor(playbackPosition) : 0;

   const partialAtDigits = useMemo(() => getTrailingPartialAtDigits(text), [text]);
   const showTimestampPicker = hasBareAtTrigger(text);
   const showNumericSuggestions = partialAtDigits != null && partialAtDigits.length > 0;

   const numericSuggestions = useMemo(
      () => (partialAtDigits ? getTimestampSuggestions(partialAtDigits) : []),
      [partialAtDigits]
   );

   const syncTimestampFromText = useCallback((newText: string) => {
      const fromMention = extractLastAtTimestampSeconds(newText);
      setTimestampPosition(fromMention);
   }, []);

   const handleTextChange = useCallback(
      (newText: string) => {
         setText(newText);
         syncTimestampFromText(newText);

         if (!newText.includes('@')) {
            setTimestampPosition(null);
         }
      },
      [syncTimestampFromText]
   );

   const selectTimestamp = useCallback(
      (position: number) => {
         setText((prev) => {
            const next = applyTimestampAt(prev, position);
            syncTimestampFromText(next);
            return next;
         });
         setTimestampPosition(position);
      },
      [syncTimestampFromText]
   );

   const selectNumericSuggestion = useCallback(
      (suffixDigit: number) => {
         if (partialAtDigits == null) return;
         setText((prev) => {
            const next = applyTimestampSuggestionAt(prev, partialAtDigits, suffixDigit);
            syncTimestampFromText(next);
            return next;
         });
      },
      [partialAtDigits, syncTimestampFromText]
   );

   const dismissTimestampPicker = useCallback(() => {
      setText((prev) => removeTrailingBareAt(prev));
   }, []);

   const reset = useCallback(() => {
      setText('');
      setTimestampPosition(null);
   }, []);

   const getMeta = useCallback(
      () => getCommentMetaFromText(text, timestampPosition),
      [text, timestampPosition]
   );

   const hasTimestamp =
      timestampPosition != null || extractLastAtTimestampSeconds(text) != null;

   return {
      text,
      setText,
      handleTextChange,
      showTimestampPicker,
      showNumericSuggestions,
      numericSuggestions,
      selectTimestamp,
      selectNumericSuggestion,
      dismissTimestampPicker,
      reset,
      getMeta,
      currentPosition,
      canUsePlayback,
      timestampPosition,
      hasTimestamp,
   };
}
