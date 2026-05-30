/** Shared spring config for tab underline and tab panel slides */
export const TAB_SLIDE_SPRING = {
   damping: 28,
   stiffness: 180,
   mass: 0.75,
   overshootClamping: true,
   restDisplacementThreshold: 0.01,
   restSpeedThreshold: 0.01,
} as const;

export const TAB_UNDERLINE_SPRING = {
   damping: 28,
   stiffness: 160,
   mass: 0.75,
   overshootClamping: true,
   restDisplacementThreshold: 0.01,
   restSpeedThreshold: 0.01,
} as const;

/** Spring for minimized player sliding between stack bottom and tab-bar offset */
export const PLAYER_BOTTOM_SPRING = {
   damping: 26,
   stiffness: 150,
   mass: 0.85,
   overshootClamping: true,
   restDisplacementThreshold: 0.01,
   restSpeedThreshold: 0.01,
} as const;

/** Left drawer slide-in (Reanimated / Animated spring params) */
export const DRAWER_SLIDE_SPRING = {
   damping: 28,
   stiffness: 110,
   mass: 1,
   overshootClamping: true,
   useNativeDriver: true as const,
};

export const DRAWER_BACKDROP_FADE_MS = 380;
export const DRAWER_CLOSE_MS = 320;

/** Bottom sheet (e.g. Add to playlist) */
export const BOTTOM_SHEET_SLIDE_SPRING = {
   damping: 32,
   stiffness: 280,
   mass: 0.85,
   overshootClamping: true,
   useNativeDriver: true as const,
};

export const BOTTOM_SHEET_BACKDROP_FADE_MS = 280;
export const BOTTOM_SHEET_CLOSE_MS = 260;
