import type { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';

export type ScreenHeaderIconKey =
   | 'home'
   | 'library'
   | 'discover'
   | 'profile'
   | 'account'
   | 'settings'
   | 'favorites'
   | 'listening-history'
   | 'downloads'
   | 'bookmarks'
   | 'playlists'
   | 'subscription-plans'
   | 'manage-devices'
   | 'update-avatar'
   | 'chapter-comments'
   | 'playback-settings'
   | 'audio-quality'
   | 'content-preferences';

type IconToneKey = {
   background: keyof ThemeColors['iconBackgrounds'];
   foreground: keyof ThemeColors['iconForegrounds'];
};

export interface ScreenHeaderIconDefinition {
   icon: keyof typeof Ionicons.glyphMap;
   title: string;
   subtitle?: string;
   tone: IconToneKey;
}

/** Central registry of screen header icons, titles, and theme tones. */
export const SCREEN_HEADER_ICONS: Record<ScreenHeaderIconKey, ScreenHeaderIconDefinition> = {
   home: {
      icon: 'home',
      title: 'Home',
      tone: { background: 'brown', foreground: 'brown' },
   },
   library: {
      icon: 'library-outline',
      title: 'Library',
      subtitle: 'Your collections',
      tone: { background: 'purple', foreground: 'purple' },
   },
   discover: {
      icon: 'compass-outline',
      title: 'Discover',
      subtitle: 'Browse and explore new stories',
      tone: { background: 'blue', foreground: 'blue' },
   },
   profile: {
      icon: 'person-outline',
      title: 'Profile',
      tone: { background: 'peach', foreground: 'brown' },
   },
   account: {
      icon: 'person-outline',
      title: 'Account',
      tone: { background: 'brown', foreground: 'brown' },
   },
   settings: {
      icon: 'settings-outline',
      title: 'Settings',
      tone: { background: 'purple', foreground: 'purple' },
   },
   favorites: {
      icon: 'heart-outline',
      title: 'Favorites',
      tone: { background: 'pink', foreground: 'pink' },
   },
   'listening-history': {
      icon: 'time-outline',
      title: 'Listening History',
      tone: { background: 'purple', foreground: 'purple' },
   },
   downloads: {
      icon: 'download-outline',
      title: 'Downloads',
      tone: { background: 'green', foreground: 'green' },
   },
   bookmarks: {
      icon: 'bookmark-outline',
      title: 'Bookmarks',
      tone: { background: 'yellow', foreground: 'yellow' },
   },
   playlists: {
      icon: 'musical-notes-outline',
      title: 'Playlists',
      tone: { background: 'purple', foreground: 'purple' },
   },
   'subscription-plans': {
      icon: 'card-outline',
      title: 'Subscription Plans',
      tone: { background: 'orange', foreground: 'orange' },
   },
   'manage-devices': {
      icon: 'desktop-outline',
      title: 'Manage devices',
      tone: { background: 'blue', foreground: 'blue' },
   },
   'update-avatar': {
      icon: 'image-outline',
      title: 'Update avatar',
      tone: { background: 'purple', foreground: 'purple' },
   },
   'chapter-comments': {
      icon: 'chatbubbles-outline',
      title: 'Comments',
      tone: { background: 'blue', foreground: 'blue' },
   },
   'playback-settings': {
      icon: 'play-circle-outline',
      title: 'Playback Settings',
      subtitle: 'Sleep timer, skip intervals, speed',
      tone: { background: 'brown', foreground: 'brown' },
   },
   'audio-quality': {
      icon: 'pulse-outline',
      title: 'Audio Quality',
      subtitle: 'Streaming quality for your plan',
      tone: { background: 'pink', foreground: 'pink' },
   },
   'content-preferences': {
      icon: 'heart-outline',
      title: 'Content Preferences',
      subtitle: 'Genres and languages you enjoy',
      tone: { background: 'pink', foreground: 'pink' },
   },
};

export interface ResolvedScreenHeaderIcon {
   icon: keyof typeof Ionicons.glyphMap;
   iconBg: string;
   iconColor: string;
   title: string;
   subtitle?: string;
}

export function resolveScreenHeaderIcon(
   key: ScreenHeaderIconKey,
   colors: ThemeColors
): ResolvedScreenHeaderIcon {
   const definition = SCREEN_HEADER_ICONS[key];
   return {
      icon: definition.icon,
      iconBg: colors.iconBackgrounds[definition.tone.background],
      iconColor: colors.iconForegrounds[definition.tone.foreground],
      title: definition.title,
      subtitle: definition.subtitle,
   };
}
