import React, { useState, useCallback, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
} from 'react-native';
import { SkeletonText } from '@/components/skeleton/SkeletonText';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '@/services/comments';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useComments } from '@/hooks/useComments';
import { useCommentTimestampAt } from '@/hooks/useCommentTimestampAt';
import { CommentInputBar } from './CommentInputBar';
import { TimestampAtPicker } from './TimestampAtPicker';
import { TimestampNumericSuggestions } from './TimestampNumericSuggestions';
import { CommentTextWithTimestamps } from './CommentTextWithTimestamps';
import { CommentAuthorHeader } from './CommentAuthorHeader';
import { useCommentTimestampSeek } from '@/hooks/useCommentTimestampSeek';

interface CommentItemProps {
   comment: Comment;
   audiobookId: string;
   playerAudiobookId: string | null;
   playbackPosition: number;
   depth?: number;
   onReply: (parentId: string, content: string, meta?: { position?: number }) => void;
   isReplying?: boolean;
   onStartReply?: (commentId: string) => void;
   onCancelReply?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
   comment,
   audiobookId,
   playerAudiobookId,
   playbackPosition,
   depth = 0,
   onReply,
   isReplying,
   onStartReply,
   onCancelReply,
}) => {
   const [repliesExpanded, setRepliesExpanded] = useState(false);
   const [replyPage, setReplyPage] = useState(1);

   const { seekToCommentTimestamp, canSeek } = useCommentTimestampSeek(audiobookId);

   const replyTimestamp = useCommentTimestampAt({
      audiobookId,
      playerAudiobookId,
      playbackPosition,
   });

   const resetReplyInput = replyTimestamp.reset;

   useEffect(() => {
      if (!isReplying) {
         resetReplyInput();
      }
   }, [isReplying, resetReplyInput]);

   const hasReplies = (comment.replyCount ?? 0) > 0;
   const { data: repliesData, isLoading: repliesLoading } = useComments(
      audiobookId,
      replyPage,
      comment.id,
      repliesExpanded
   );

   const replies = repliesData?.data ?? [];
   const repliesPagination = repliesData?.pagination;

   const handleSendReply = useCallback(() => {
      const trimmed = replyTimestamp.text.trim();
      if (!trimmed) return;
      const meta = replyTimestamp.getMeta();
      onReply(comment.id, trimmed, meta);
      replyTimestamp.reset();
      onCancelReply?.();
      setRepliesExpanded(true);
   }, [replyTimestamp, comment.id, onReply, onCancelReply]);

   return (
      <View>
      <View style={[styles.container, depth > 0 && styles.nested]}>
         {depth > 0 ? <View style={styles.nestedBar} /> : null}
         <View style={styles.commentRow}>
            <View style={styles.commentMain}>
               <CommentTextWithTimestamps
                  content={comment.content}
                  canSeek={canSeek}
                  onTimestampPress={seekToCommentTimestamp}
               />

               <View style={styles.actions}>
                  {depth === 0 && onStartReply && (
                     <TouchableOpacity onPress={() => onStartReply(comment.id)}>
                        <Text style={styles.actionText}>Reply</Text>
                     </TouchableOpacity>
                  )}
                  {hasReplies && depth === 0 && !repliesExpanded && (
                     <TouchableOpacity onPress={() => setRepliesExpanded(true)}>
                        <Text style={styles.actionText}>
                           View replies ({comment.replyCount})
                        </Text>
                     </TouchableOpacity>
                  )}
               </View>
            </View>
            <CommentAuthorHeader comment={comment} />
         </View>

         {isReplying && (
            <View style={styles.replyComposer}>
               {replyTimestamp.showNumericSuggestions && (
                  <TimestampNumericSuggestions
                     suggestions={replyTimestamp.numericSuggestions}
                     onSelect={replyTimestamp.selectNumericSuggestion}
                  />
               )}
               {replyTimestamp.showTimestampPicker && !replyTimestamp.showNumericSuggestions && (
                  <TimestampAtPicker
                     positionSeconds={replyTimestamp.currentPosition}
                     canUsePlayback={replyTimestamp.canUsePlayback}
                     onSelect={replyTimestamp.selectTimestamp}
                     onDismiss={replyTimestamp.dismissTimestampPicker}
                  />
               )}
               {replyTimestamp.hasTimestamp && !replyTimestamp.showTimestampPicker && (
                  <View style={styles.timestampBadge}>
                     <Ionicons name="time" size={14} color={colors.accent.primary} />
                     <Text style={styles.timestampBadgeText}>Timestamp attached</Text>
                  </View>
               )}
               <CommentInputBar
                  placeholder="Write a reply... Type @ to tag a time"
                  disabled={false}
                  value={replyTimestamp.text}
                  onChangeText={replyTimestamp.handleTextChange}
                  onSend={handleSendReply}
                  highlightTimestamps
               />
               {onCancelReply && (
                  <TouchableOpacity onPress={onCancelReply}>
                     <Text style={styles.cancelReply}>Cancel</Text>
                  </TouchableOpacity>
               )}
            </View>
         )}

         {repliesExpanded && (
            <View style={styles.replies}>
               {repliesLoading && replies.length === 0 ? (
                  <SkeletonText width="60%" height={12} style={styles.repliesSkeleton} />
               ) : (
                  replies.map((reply) => (
                     <CommentItem
                        key={reply.id}
                        comment={reply}
                        audiobookId={audiobookId}
                        playerAudiobookId={playerAudiobookId}
                        playbackPosition={playbackPosition}
                        depth={depth + 1}
                        onReply={onReply}
                     />
                  ))
               )}
               {repliesPagination?.hasNextPage && (
                  <TouchableOpacity
                     onPress={() => setReplyPage((p) => p + 1)}
                     style={styles.loadMore}
                  >
                     <Text style={styles.actionText}>Load more replies</Text>
                  </TouchableOpacity>
               )}
            </View>
         )}
      </View>
      <View style={styles.divider} />
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
   },
   nested: {
      marginLeft: spacing.lg,
      paddingLeft: spacing.sm,
   },
   nestedBar: {
      position: 'absolute',
      left: 0,
      top: spacing.sm,
      bottom: spacing.sm,
      width: 2,
      backgroundColor: colors.background.highlight,
      borderRadius: 1,
   },
   divider: {
      height: 1,
      backgroundColor: colors.background.highlight,
   },
   commentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
   },
   commentMain: {
      flex: 1,
      minWidth: 0,
   },
   actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
   },
   actionText: {
      fontSize: typography.fontSize.sm,
      color: colors.accent.primary,
      fontWeight: '600',
   },
   replyComposer: {
      marginTop: spacing.sm,
   },
   timestampBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.highlight,
   },
   timestampBadgeText: {
      fontSize: typography.fontSize.xs,
      color: colors.accent.primary,
      fontWeight: '600',
   },
   cancelReply: {
      fontSize: typography.fontSize.sm,
      color: colors.text.muted,
      marginTop: spacing.xs,
   },
   replies: {
      marginTop: spacing.sm,
   },
   repliesSkeleton: {
      marginVertical: spacing.sm,
   },
   loadMore: {
      paddingVertical: spacing.sm,
   },
});
