import React from 'react';
import { router } from 'expo-router';
import { LibraryScreenLayout } from '@/components/library/LibraryScreenLayout';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';

export default function LibraryDownloadsScreen() {
   return (
      <LibraryScreenLayout headerIcon="downloads" onBack={() => router.back()}>
         <LibraryEmptyState
            title="No downloads yet"
            hint="Stories you download for offline listening will appear here."
         />
      </LibraryScreenLayout>
   );
}
