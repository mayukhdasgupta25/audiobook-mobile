/** Full-page mood detail loading skeleton. */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SkeletonMoodHero } from './SkeletonMoodHero';
import { SkeletonMoodBestForRow } from './SkeletonMoodBestForRow';
import { SkeletonMoodRecommendations } from './SkeletonMoodAudiobookRow';
import { SkeletonMoodAbout } from './SkeletonMoodAbout';
import { spacing } from '@/theme';

export function SkeletonMoodDetailPage() {
   return (
      <ScrollView
         style={styles.scroll}
         contentContainerStyle={styles.content}
         showsVerticalScrollIndicator={false}
      >
         <SkeletonMoodHero />
         <SkeletonMoodBestForRow />
         <SkeletonMoodRecommendations count={4} />
         <SkeletonMoodAbout />
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   scroll: {
      flex: 1,
   },
   content: {
      paddingBottom: spacing.xxl,
   },
});
