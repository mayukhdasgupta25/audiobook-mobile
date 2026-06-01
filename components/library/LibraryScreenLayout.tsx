import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ScreenHeaderIconKey } from '@/constants/screenHeaderIcons';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface LibraryScreenLayoutProps {
   headerIcon: ScreenHeaderIconKey;
   title?: string;
   onBack: () => void;
   children: React.ReactNode;
}

/** Shared shell for library list screens — matches Account / Settings header style. */
export function LibraryScreenLayout({
   headerIcon,
   title,
   onBack,
   children,
}: LibraryScreenLayoutProps) {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flex: 1,
            backgroundColor: t.colors.background.screen,
         },
         content: {
            flex: 1,
         },
      })
   );

   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <ScreenHeader
            headerIcon={headerIcon}
            title={title}
            onBack={onBack}
            titleSize="large"
         />
         <View style={styles.content}>{children}</View>
      </SafeAreaView>
   );
}
