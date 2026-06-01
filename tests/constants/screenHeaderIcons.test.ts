import {
   SCREEN_HEADER_ICONS,
   resolveScreenHeaderIcon,
} from '@/constants/screenHeaderIcons';
import { lightColors } from '@/theme/colors';

describe('screenHeaderIcons', () => {
   it('defines icons for all stack header keys', () => {
      expect(SCREEN_HEADER_ICONS.account.icon).toBe('person-outline');
      expect(SCREEN_HEADER_ICONS.favorites.icon).toBe('heart-outline');
      expect(SCREEN_HEADER_ICONS['listening-history'].title).toBe('Listening History');
   });

   it('matches tab bar icons for library and discover', () => {
      expect(SCREEN_HEADER_ICONS.library.icon).toBe('library-outline');
      expect(SCREEN_HEADER_ICONS.library.subtitle).toBe('Your collections');
      expect(SCREEN_HEADER_ICONS.discover.icon).toBe('compass-outline');
      expect(SCREEN_HEADER_ICONS.discover.subtitle).toBe('Browse and explore new stories');
   });

   it('resolves themed icon colors from the registry', () => {
      const resolved = resolveScreenHeaderIcon('settings', lightColors);
      expect(resolved.icon).toBe('settings-outline');
      expect(resolved.title).toBe('Settings');
      expect(resolved.iconBg).toBe(lightColors.iconBackgrounds.purple);
      expect(resolved.iconColor).toBe(lightColors.iconForegrounds.purple);
   });
});
