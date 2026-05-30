/**
 * Helpers for @ timestamp mentions in comments
 */

export type AtHighlightSegmentType = 'text' | 'at-bare' | 'at-partial' | 'at-complete';

export interface AtHighlightSegment {
   type: AtHighlightSegmentType;
   value: string;
}

export interface TimestampSuggestion {
   displayLabel: string;
   insertLabel: string;
   seconds: number;
}

/** Complete @timestamp token (e.g. @2:05, @0:01, @1:01:01) */
const AT_COMPLETE_MENTION_REGEX = /@\d{1,2}(?::\d{1,2}){1,2}/g;

/** Trailing @ with optional partial digits while typing */
const AT_TRAILING_PARTIAL_REGEX = /(.*?)(@\d*)$/;
const AT_TRAILING_BARE_REGEX = /(.*?)(@)$/;

/** True when the user just typed @ and has not picked a timestamp yet */
export function hasBareAtTrigger(text: string): boolean {
   return /(?:^|\s)@[\s]*$/.test(text);
}

/** Partial digits after trailing @ (e.g. "@0" → "0") */
export function getTrailingPartialAtDigits(text: string): string | null {
   const match = text.match(/(?:^|\s)@(\d+)$/);
   return match ? match[1] : null;
}

/** Format seconds as mm:ss or h:mm:ss for @ mentions in comment text */
export function formatTimestampForAt(seconds: number): string {
   const total = Math.max(0, Math.round(seconds));
   const hours = Math.floor(total / 3600);
   const minutes = Math.floor((total % 3600) / 60);
   const secs = total % 60;

   if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   }
   return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/** Parse compact digit sequences used in suggestions (e.g. "01" → 1s, "10" → 1:00) */
export function parseAtTimestampDigits(digits: string): number {
   if (!/^\d+$/.test(digits) || digits.length === 0) return 0;

   if (digits.length === 1) {
      return parseInt(digits, 10) * 60;
   }
   if (digits.length === 2) {
      const minutes = parseInt(digits[0], 10);
      const seconds = parseInt(digits[1], 10);
      return minutes * 60 + seconds;
   }
   if (digits.length === 3) {
      const minutes = parseInt(digits.slice(0, 2), 10);
      const seconds = parseInt(digits[2], 10);
      return minutes * 60 + seconds;
   }
   const minutes = parseInt(digits.slice(0, 2), 10);
   const seconds = parseInt(digits.slice(2), 10);
   return minutes * 60 + seconds;
}

/**
 * Suggestions while typing digits after @.
 * e.g. "@0" → 01…09, "@1" → 10…19
 */
export function getTimestampSuggestions(partialDigits: string): TimestampSuggestion[] {
   if (!/^\d+$/.test(partialDigits)) return [];

   const startSuffix = partialDigits === '0' ? 1 : 0;
   const suggestions: TimestampSuggestion[] = [];

   for (let suffix = startSuffix; suffix <= 9; suffix++) {
      const combined = `${partialDigits}${suffix}`;
      const seconds = parseAtTimestampDigits(combined);
      const insertLabel = formatTimestampForAt(seconds);
      suggestions.push({
         displayLabel: combined,
         insertLabel,
         seconds,
      });
   }

   return suggestions;
}

/** Parse @2:05 or 2:05 into seconds */
export function parseAtTimestampLabelToSeconds(label: string): number | null {
   const raw = label.startsWith('@') ? label.slice(1) : label;
   if (!raw.includes(':')) return null;

   const parts = raw.split(':').map((p) => parseInt(p, 10));
   if (parts.some((n) => Number.isNaN(n))) return null;

   if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
   }
   if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
   }
   return null;
}

/** Last complete @timestamp in text, for comment meta */
export function extractLastAtTimestampSeconds(text: string): number | null {
   const matches = [...text.matchAll(AT_COMPLETE_MENTION_REGEX)];
   if (matches.length === 0) return null;
   const last = matches[matches.length - 1][0];
   return parseAtTimestampLabelToSeconds(last);
}

/** Split text into segments for brown @ highlighting in inputs and comments */
export function splitTextForAtHighlights(text: string): AtHighlightSegment[] {
   const segments: AtHighlightSegment[] = [];
   let cursor = 0;

   for (const match of text.matchAll(AT_COMPLETE_MENTION_REGEX)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      pushChunkSegments(text.slice(cursor, start), segments, false);
      segments.push({ type: 'at-complete', value: match[0] });
      cursor = end;
   }

   pushChunkSegments(text.slice(cursor), segments, true);
   return segments;
}

function pushChunkSegments(
   chunk: string,
   segments: AtHighlightSegment[],
   isTail: boolean
): void {
   if (!chunk) return;

   if (!isTail) {
      segments.push({ type: 'text', value: chunk });
      return;
   }

   const partial = chunk.match(AT_TRAILING_PARTIAL_REGEX);
   if (partial) {
      if (partial[1]) {
         segments.push({ type: 'text', value: partial[1] });
      }
      segments.push({ type: 'at-partial', value: partial[2] });
      return;
   }

   const bare = chunk.match(AT_TRAILING_BARE_REGEX);
   if (bare) {
      if (bare[1]) {
         segments.push({ type: 'text', value: bare[1] });
      }
      segments.push({ type: 'at-bare', value: '@' });
      return;
   }

   segments.push({ type: 'text', value: chunk });
}

/** Replace trailing bare @ with @m:ss and a trailing space */
export function applyTimestampAt(text: string, positionSeconds: number): string {
   const label = formatTimestampForAt(positionSeconds);
   if (/(?:^|\s)@[\s]*$/.test(text)) {
      return text.replace(/@([\s]*)$/, `@${label} `);
   }
   if (/@(\d*)$/.test(text)) {
      return text.replace(/@(\d*)$/, `@${label} `);
   }
   return `${text}@${label} `;
}

/** Apply a numeric suggestion after partial @digits */
export function applyTimestampSuggestionAt(
   text: string,
   partialDigits: string,
   suffixDigit: number
): string {
   const combined = `${partialDigits}${suffixDigit}`;
   const seconds = parseAtTimestampDigits(combined);
   const label = formatTimestampForAt(seconds);
   return text.replace(/@(\d*)$/, `@${label} `);
}

/** Remove a trailing @ that did not get a timestamp */
export function removeTrailingBareAt(text: string): string {
   if (/@\d+$/.test(text)) {
      return text.replace(/@(\d+)$/, '').trimEnd();
   }
   return text.replace(/(?:^|\s)@[\s]*$/, '').trimEnd();
}

export function getCommentMetaFromTimestamp(
   position: number | null
): { position: number } | undefined {
   if (position == null || position < 0) return undefined;
   return { position };
}

/** Meta from last @mention in text, falling back to explicit position state */
export function getCommentMetaFromText(
   text: string,
   explicitPosition: number | null
): { position: number } | undefined {
   const fromText = extractLastAtTimestampSeconds(text);
   const position = fromText ?? explicitPosition;
   return getCommentMetaFromTimestamp(position);
}
