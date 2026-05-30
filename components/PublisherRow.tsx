import React from 'react';
import {
   View,
   Text,
   ScrollView,
   StyleSheet,
   ActivityIndicator,
   Platform,
} from 'react-native';
import { PublisherCard } from './PublisherCard';
import { Organization } from '@/services/organizations';
import { colors, spacing, typography } from '@/theme';

interface PublisherRowProps {
   title?: string;
   organizations: Organization[];
   isLoading?: boolean;
   getImageUri: (org: Organization) => string | undefined;
   onPress?: (org: Organization) => void;
}

export const PublisherRow: React.FC<PublisherRowProps> = ({
   title = 'Publishers',
   organizations,
   isLoading,
   getImageUri,
   onPress,
}) => {
   if (isLoading) {
      return (
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <ActivityIndicator color={colors.accent.primary} />
         </View>
      );
   }

   if (organizations.length === 0) {
      return null;
   }

   return (
      <View style={styles.section}>
         <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>{title}</Text>
         <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
         >
            {organizations.map((org) => (
               <PublisherCard
                  key={org.id}
                  name={org.name}
                  imageUri={getImageUri(org)}
                  onPress={onPress ? () => onPress(org) : undefined}
               />
            ))}
         </ScrollView>
      </View>
   );
};

const styles = StyleSheet.create({
   section: {
      marginBottom: spacing.lg,
   },
   sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.sm,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   sectionTitlePadded: {
      paddingHorizontal: spacing.md,
   },
   scrollContent: {
      paddingHorizontal: spacing.md,
   },
});
