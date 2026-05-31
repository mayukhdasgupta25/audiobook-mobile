/**
 * Theme-aware styles for @timestamp mentions (composer + comments).
 */
import { StyleSheet } from 'react-native';
import type { ThemeColors } from './colors';

const borderRadiusSm = 4;

const mentionText = {
   color: '#FFFFFF',
   fontWeight: '700' as const,
};

const mentionPill = {
   borderRadius: borderRadiusSm,
   paddingHorizontal: 4,
   paddingVertical: 2,
   overflow: 'hidden' as const,
   borderWidth: 1,
};

export function getTimestampMentionStyles(c: ThemeColors) {
   return StyleSheet.create({
      /** Bare @ or @digits while the user is still typing */
      typing: {
         ...mentionPill,
         ...mentionText,
         backgroundColor: c.accent.primary,
         borderColor: c.accent.primaryDark,
      },
      /** Finished @m:ss mention */
      complete: {
         ...mentionPill,
         ...mentionText,
         backgroundColor: c.accent.primaryDark,
         borderColor: c.primary[800],
      },
      /** Finished mention when playback seek is available */
      tappable: {
         ...mentionPill,
         ...mentionText,
         backgroundColor: c.primary[800],
         borderColor: c.primary[900],
         textDecorationLine: 'underline',
      },
   });
}
