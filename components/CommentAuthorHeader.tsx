import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Comment } from '@/services/comments';
import { RootState } from '@/store';
import { typography } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getCommentAuthorLabel } from '@/utils/commentAuthor';

interface CommentAuthorHeaderProps {
   comment: Comment;
}

export const CommentAuthorHeader: React.FC<CommentAuthorHeaderProps> = ({ comment }) => {
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         column: {
            alignItems: 'flex-end',
            maxWidth: 96,
            flexShrink: 0,
         },
         name: {
            fontSize: typography.fontSize.xs,
            fontWeight: '600',
            color: t.colors.text.primary,
            textAlign: 'right',
         },
      })
   );

   const label = useMemo(
      () => getCommentAuthorLabel(comment, userProfile?.id),
      [comment, userProfile?.id]
   );

   return (
      <View style={styles.column}>
         <Text style={styles.name} numberOfLines={2}>
            {label}
         </Text>
      </View>
   );
};
