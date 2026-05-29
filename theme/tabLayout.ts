import { Platform } from 'react-native';
import { spacing } from '@/theme';

/** Base tab bar content height (excluding safe area) */
export const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 56 : 52;

/** Inner padding inside the floating pill */
const TAB_BAR_PADDING_TOP = Platform.OS === 'ios' ? 8 : 6;
const TAB_BAR_PADDING_BOTTOM = Platform.OS === 'ios' ? 12 : 8;

export function getTabBarFloatHorizontal(): number {
   return spacing.tabBarFloatHorizontal;
}

export function getTabBarFloatBottom(): number {
   return spacing.tabBarFloatBottom;
}

/** Height of the tab bar pill itself (no float margins or safe area). */
export function getTabBarInnerHeight(): number {
   return TAB_BAR_BASE_HEIGHT + TAB_BAR_PADDING_TOP + TAB_BAR_PADDING_BOTTOM;
}

/**
 * Total vertical space occupied by the floating tab bar from the screen bottom,
 * including float margin and safe area inset.
 */
export function getTabBarHeight(bottomInset: number): number {
   return getTabBarInnerHeight() + bottomInset + getTabBarFloatBottom();
}

/**
 * Total scroll padding bottom for tab screens: floating tab bar + gap above it.
 */
export function getTabScreenPaddingBottom(bottomInset: number): number {
   return getTabBarHeight(bottomInset) + spacing.tabBarGap;
}

export function getTabBarPaddingTop(): number {
   return TAB_BAR_PADDING_TOP;
}

export function getTabBarPaddingBottom(): number {
   return TAB_BAR_PADDING_BOTTOM;
}

/** Height of the minimized horizontal player bar */
export const MINIMIZED_PLAYER_BAR_HEIGHT = 76;

/**
 * Bottom offset for the minimized player.
 * Tab screens: above the floating tab bar. Stack screens (e.g. details): near screen bottom.
 */
export function getMinimizedPlayerBottom(
   hasBottomTabBar: boolean,
   bottomInset: number
): number {
   if (hasBottomTabBar) {
      return getTabBarHeight(bottomInset) + spacing.sm;
   }
   return bottomInset + getTabBarFloatBottom();
}

/** Scroll padding when minimized player is visible on screens without a tab bar. */
export function getMinimizedPlayerScrollPadding(bottomInset: number): number {
   return (
      MINIMIZED_PLAYER_BAR_HEIGHT +
      getTabBarFloatBottom() +
      spacing.sm +
      bottomInset
   );
}
