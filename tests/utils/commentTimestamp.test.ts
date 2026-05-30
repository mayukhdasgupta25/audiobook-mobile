import {
   hasBareAtTrigger,
   applyTimestampAt,
   applyTimestampSuggestionAt,
   removeTrailingBareAt,
   formatTimestampForAt,
   getCommentMetaFromTimestamp,
   getCommentMetaFromText,
   getTrailingPartialAtDigits,
   getTimestampSuggestions,
   parseAtTimestampDigits,
   parseAtTimestampLabelToSeconds,
   extractLastAtTimestampSeconds,
   splitTextForAtHighlights,
} from '@/utils/commentTimestamp';

describe('commentTimestamp utils', () => {
   it('detects bare @ at end of text', () => {
      expect(hasBareAtTrigger('Hello @')).toBe(true);
      expect(hasBareAtTrigger('@')).toBe(true);
      expect(hasBareAtTrigger('Hello @1:30')).toBe(false);
   });

   it('detects partial digits after @', () => {
      expect(getTrailingPartialAtDigits('Hello @0')).toBe('0');
      expect(getTrailingPartialAtDigits('Hello @')).toBeNull();
   });

   it('suggests 01–09 for @0', () => {
      const suggestions = getTimestampSuggestions('0');
      expect(suggestions).toHaveLength(9);
      expect(suggestions[0].displayLabel).toBe('01');
      expect(suggestions[0].seconds).toBe(1);
      expect(suggestions[8].displayLabel).toBe('09');
   });

   it('suggests 10–19 for @1', () => {
      const suggestions = getTimestampSuggestions('1');
      expect(suggestions[0].displayLabel).toBe('10');
      expect(suggestions[0].seconds).toBe(60);
   });

   it('applies timestamp after @', () => {
      expect(applyTimestampAt('Nice point @', 125)).toBe('Nice point @2:05 ');
   });

   it('applies numeric suggestion', () => {
      expect(applyTimestampSuggestionAt('Point @0', '0', 2)).toBe('Point @0:02 ');
   });

   it('removes trailing bare @ or partial digits', () => {
      expect(removeTrailingBareAt('Partial @')).toBe('Partial');
      expect(removeTrailingBareAt('Partial @0')).toBe('Partial');
   });

   it('formats mm:ss for at mentions', () => {
      expect(formatTimestampForAt(125)).toBe('2:05');
      expect(formatTimestampForAt(3661)).toBe('1:01:01');
   });

   it('parses timestamp labels to seconds', () => {
      expect(parseAtTimestampLabelToSeconds('@2:05')).toBe(125);
      expect(parseAtTimestampLabelToSeconds('0:01')).toBe(1);
   });

   it('parses compact digit timestamps', () => {
      expect(parseAtTimestampDigits('01')).toBe(1);
      expect(parseAtTimestampDigits('10')).toBe(60);
   });

   it('extracts last @mention seconds from text', () => {
      expect(extractLastAtTimestampSeconds('Before @1:00 and @2:30 end')).toBe(150);
   });

   it('builds meta from position or text', () => {
      expect(getCommentMetaFromTimestamp(120)).toEqual({ position: 120 });
      expect(getCommentMetaFromTimestamp(null)).toBeUndefined();
      expect(getCommentMetaFromText('See @2:05', null)).toEqual({ position: 125 });
   });

   it('splits text for @ highlighting', () => {
      const segments = splitTextForAtHighlights('Hi @0');
      expect(segments).toEqual([
         { type: 'text', value: 'Hi ' },
         { type: 'at-partial', value: '@0' },
      ]);
      const done = splitTextForAtHighlights('Hi @0:02 ');
      expect(done.some((s) => s.type === 'at-complete')).toBe(true);
   });
});
