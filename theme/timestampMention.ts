/**
 * High-contrast styles for @timestamp mentions (composer + comments).
 * Color literals match theme/index.ts — kept local to avoid circular imports.
 */
import { StyleSheet } from 'react-native';

const accentPrimary = '#6F431B';
const accentPrimaryDark = '#4B2C20';
const primary800 = '#3D2319';
const primary900 = '#2A1810';
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

export const timestampMentionStyles = StyleSheet.create({
   /** Bare @ or @digits while the user is still typing */
   typing: {
      ...mentionPill,
      ...mentionText,
      backgroundColor: accentPrimary,
      borderColor: accentPrimaryDark,
   },
   /** Finished @m:ss mention */
   complete: {
      ...mentionPill,
      ...mentionText,
      backgroundColor: accentPrimaryDark,
      borderColor: primary800,
   },
   /** Finished mention when playback seek is available */
   tappable: {
      ...mentionPill,
      ...mentionText,
      backgroundColor: primary800,
      borderColor: primary900,
      textDecorationLine: 'underline',
   },
});
