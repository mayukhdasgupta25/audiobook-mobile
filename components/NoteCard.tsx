import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Note } from '@/services/notes';
import { formatDuration } from '@/utils/duration';

interface NoteCardProps {
   note: Note;
   onDelete?: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
   const positionLabel =
      note.position > 0 ? `@ ${formatDuration(note.position)}` : undefined;

   return (
      <View style={styles.card}>
         <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
               {note.title}
            </Text>
            {onDelete && (
               <TouchableOpacity
                  onPress={() => onDelete(note.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
               >
                  <Ionicons name="trash-outline" size={18} color={colors.text.muted} />
               </TouchableOpacity>
            )}
         </View>
         {positionLabel && (
            <Text style={styles.position}>{positionLabel}</Text>
         )}
         <Text style={styles.content} numberOfLines={4}>
            {note.content}
         </Text>
      </View>
   );
};

const styles = StyleSheet.create({
   card: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   title: {
      flex: 1,
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.primary,
      marginRight: spacing.sm,
      ...Platform.select({
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   position: {
      fontSize: typography.fontSize.sm,
      color: colors.accent.primary,
      marginTop: spacing.xs,
   },
   content: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.sm,
      lineHeight: 20,
   },
});
