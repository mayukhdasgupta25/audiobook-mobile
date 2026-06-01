import React from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SCREEN_HEADER_ICONS, type ScreenHeaderIconKey } from '@/constants/screenHeaderIcons';

interface TabScreenHeaderProps {
   /** Must match a main tab route icon from `app/(tabs)/_layout.tsx`. */
   headerIcon: Extract<ScreenHeaderIconKey, 'home' | 'library' | 'discover' | 'profile'>;
   title?: string;
   subtitle?: string;
   rightActions?: React.ReactNode;
}

/** Tab root headers — no back button; icon/title from the central registry. */
export function TabScreenHeader({
   headerIcon,
   title,
   subtitle,
   rightActions,
}: TabScreenHeaderProps) {
   const registrySubtitle = SCREEN_HEADER_ICONS[headerIcon].subtitle;

   return (
      <ScreenHeader
         headerIcon={headerIcon}
         title={title}
         subtitle={subtitle ?? registrySubtitle}
         showBack={false}
         titleSize="large"
         rightActions={rightActions}
      />
   );
}
