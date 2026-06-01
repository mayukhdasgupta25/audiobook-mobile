import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import type { Audiobook } from '@/services/audiobooks';
import type { ListeningHistoryEntry } from '@/services/listeningHistory';
import { AudiobookLibraryRow } from '@/components/library/AudiobookLibraryRow';
import { spacing, typography, borderRadius } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatAccountDate } from '@/utils/format';
import { formatListeningDurationFromSeconds } from '@/utils/listeningDuration';

interface ListeningHistoryRowProps {
   entry: ListeningHistoryEntry;
   audiobook?: Audiobook;
   onPress: () => void;
}

function buildHistorySubtitle(entry: ListeningHistoryEntry): string | undefined {
   const parts: string[] = [];

   if (entry.progress != null && entry.progress > 0) {
      parts.push(`Listened ${formatListeningDurationFromSeconds(entry.progress)}`);
   }

   const dateSource = entry.lastListenedAt ?? entry.updatedAt ?? entry.createdAt;
   if (dateSource) {
      parts.push(formatAccountDate(dateSource));
   }

   return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function ListeningHistoryRow({
   entry,
   audiobook,
   onPress,
}: ListeningHistoryRowProps) {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         badge: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            backgroundColor: entry.completed
               ? t.colors.iconBackgrounds.green
               : t.colors.background.highlight,
         },
         badgeText: {
            fontSize: typography.fontSize.xs,
            fontWeight: '600',
            color: entry.completed
               ? t.colors.iconForegrounds.green
               : t.colors.text.secondary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         fallbackRow: {
            padding: spacing.md,
         },
         fallbackTitle: {
            fontSize: typography.fontSize.base,
            color: t.colors.text.primary,
            marginBottom: spacing.xs,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         fallbackMeta: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
         },
      })
   );

   const statusBadge = (
      <View style={styles.badge}>
         <Text style={styles.badgeText}>
            {entry.completed ? 'Completed' : 'In progress'}
         </Text>
      </View>
   );

   if (!audiobook) {
      const subtitle = buildHistorySubtitle(entry);
      return (
         <TouchableOpacity
            style={styles.fallbackRow}
            onPress={onPress}
            activeOpacity={0.7}
         >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
               <Text style={[styles.fallbackTitle, { flex: 1, marginBottom: 0 }]}>
                  Audiobook
               </Text>
               {statusBadge}
            </View>
            <Text style={styles.fallbackMeta}>
               {subtitle ?? (entry.completed ? 'Completed' : 'In progress')}
            </Text>
         </TouchableOpacity>
      );
   }

   return (
      <AudiobookLibraryRow
         audiobook={audiobook}
         subtitle={buildHistorySubtitle(entry)}
         onPress={onPress}
         trailing={statusBadge}
      />
   );
}
