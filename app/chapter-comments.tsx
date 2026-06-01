import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   Platform,
   TouchableOpacity,
   TouchableWithoutFeedback,
   Keyboard,
   FlatList,
   Dimensions,
   type KeyboardEvent,
   ActivityIndicator,
   Modal,
   TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TabUnderline } from '@/components/TabUnderline';
import { TabSlideView } from '@/components/TabSlideView';
import { CommentInputBar } from '@/components/CommentInputBar';
import { SkeletonCommentRow, SkeletonNoteCard } from '@/components/skeleton';
import { TimestampAtPicker } from '@/components/TimestampAtPicker';
import { TimestampNumericSuggestions } from '@/components/TimestampNumericSuggestions';
import { CommentItem } from '@/components/CommentItem';
import { useCommentTimestampAt } from '@/hooks/useCommentTimestampAt';
import { NoteCard } from '@/components/NoteCard';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { setMinimized, setUiSuppressed } from '@/store/player';
import { getTabBarFloatBottom } from '@/theme/tabLayout';
import { useComments, useCommentMutation } from '@/hooks/useComments';
import { useNotes, useNoteMutations } from '@/hooks/useNotes';
import { RootState } from '@/store';
import { Comment } from '@/services/comments';

type CommentTab = 'comments' | 'notes';

/** Extra space so the input sits clearly above the keyboard */
const KEYBOARD_INPUT_GAP = spacing.md;

function getKeyboardLift(event: KeyboardEvent): number {
   const { height, screenY } = event.endCoordinates;
   const windowHeight = Dimensions.get('window').height;
   const liftFromPosition = windowHeight - screenY;

   // Android adjustResize can report a small positional lift; use full keyboard height
   const lift =
      Platform.OS === 'android'
         ? Math.max(liftFromPosition, height)
         : liftFromPosition > 0
           ? liftFromPosition
           : height;

   return lift + KEYBOARD_INPUT_GAP;
}

export default function ChapterCommentsScreen() {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         flex: { flex: 1 },
         dismissKeyboardArea: {
            flex: 1,
         },
         container: {
            flex: 1,
            backgroundColor: t.colors.background.screen,
         },
         timestampBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            marginHorizontal: spacing.md,
            marginBottom: spacing.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.md,
            backgroundColor: t.colors.background.highlight,
         },
         timestampBadgeText: {
            fontSize: typography.fontSize.xs,
            color: t.colors.accent.primary,
            fontWeight: '600',
         },
         emptyState: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
         },
         emptyTitle: {
            fontSize: typography.fontSize.lg,
            fontWeight: '600',
            color: t.colors.text.primary,
            marginTop: spacing.md,
         },
         emptyHint: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            textAlign: 'center',
            marginTop: spacing.sm,
         },
         centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
         },
         loadMore: {
            padding: spacing.lg,
            alignItems: 'center',
         },
         loadMoreText: {
            color: t.colors.accent.primary,
            fontWeight: '600',
         },
         fab: {
            position: 'absolute',
            right: spacing.md,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: t.colors.accent.primary,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 4,
         },
         modalBackdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            padding: spacing.lg,
         },
         modalCard: {
            backgroundColor: t.colors.background.screen,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
         },
         modalTitle: {
            fontSize: typography.fontSize.lg,
            fontWeight: '700',
            color: t.colors.text.primary,
            marginBottom: spacing.md,
         },
         modalInput: {
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            color: t.colors.text.primary,
            backgroundColor: t.colors.background.input,
         },
         modalTextArea: {
            minHeight: 100,
            textAlignVertical: 'top',
         },
         modalActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: spacing.lg,
            marginTop: spacing.md,
         },
         modalCancel: {
            color: t.colors.text.secondary,
         },
         modalSave: {
            backgroundColor: t.colors.accent.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
         },
         modalSaveText: {
            color: t.colors.text.light,
            fontWeight: '600',
         },
      })
   );
   const dispatch = useDispatch();
   const insets = useSafeAreaInsets();
   const params = useLocalSearchParams<{
      audiobookId?: string;
      chapterId?: string;
      chapterTitle?: string;
      chapterNumber?: string;
   }>();

   const audiobookId = params.audiobookId ?? '';
   const playbackPosition = useSelector((state: RootState) => state.player.playbackPosition);
   const playerAudiobookId = useSelector((state: RootState) => state.player.audiobookId);

   const [activeTab, setActiveTab] = useState<CommentTab>('comments');
   const [commentPage, setCommentPage] = useState(1);
   const [allComments, setAllComments] = useState<Comment[]>([]);
   const [replyingToId, setReplyingToId] = useState<string | null>(null);

   const commentTimestamp = useCommentTimestampAt({
      audiobookId,
      playerAudiobookId,
      playbackPosition,
   });

   const [noteModalVisible, setNoteModalVisible] = useState(false);
   const [noteTitle, setNoteTitle] = useState('');
   const [noteContent, setNoteContent] = useState('');
   const [keyboardBottomInset, setKeyboardBottomInset] = useState(0);

   useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const showSub = Keyboard.addListener(showEvent, (event) => {
         setKeyboardBottomInset(getKeyboardLift(event));
      });
      const hideSub = Keyboard.addListener(hideEvent, () => {
         setKeyboardBottomInset(0);
      });

      return () => {
         showSub.remove();
         hideSub.remove();
      };
   }, []);

   const { data: commentsData, isLoading: commentsLoading, isFetching } = useComments(
      audiobookId,
      commentPage
   );
   const commentMutation = useCommentMutation(audiobookId);
   const { data: notesData, isLoading: notesLoading } = useNotes(audiobookId);
   const { create: createNote, remove: removeNote } = useNoteMutations(audiobookId);

   const notes = notesData?.data ?? [];
   const commentsPagination = commentsData?.pagination;

   React.useEffect(() => {
      if (!commentsData?.data) return;
      setAllComments((prev) => {
         if (commentPage === 1) return commentsData.data;
         const ids = new Set(prev.map((c) => c.id));
         const merged = [...prev];
         for (const c of commentsData.data) {
            if (!ids.has(c.id)) merged.push(c);
         }
         return merged;
      });
   }, [commentsData, commentPage]);

   useFocusEffect(
      useCallback(() => {
         dispatch(setUiSuppressed(true));
         dispatch(setMinimized(true));
         return () => {
            dispatch(setUiSuppressed(false));
            dispatch(setMinimized(true));
         };
      }, [dispatch])
   );

   const chapterTitle = params.chapterTitle ?? 'Chapter';
   const chapterNumber = params.chapterNumber;
   const subtitle = chapterNumber ? `Chapter ${chapterNumber}` : undefined;

   const tabs = useMemo(
      () => [
         { key: 'comments', label: 'Comments', count: allComments.length },
         { key: 'notes', label: 'Notes', count: notes.length },
      ],
      [allComments.length, notes.length]
   );

   const handleTabPress = useCallback((key: string) => {
      const nextTab = key as CommentTab;
      setActiveTab(nextTab);
      if (nextTab !== 'comments') {
         Keyboard.dismiss();
         setReplyingToId(null);
      }
   }, []);

   const handlePostComment = useCallback(() => {
      const trimmed = commentTimestamp.text.trim();
      if (!trimmed || !audiobookId) return;
      const meta = commentTimestamp.getMeta();
      commentMutation.mutate(
         {
            content: trimmed,
            ...(meta ? { meta } : {}),
         },
         {
            onSuccess: () => {
               commentTimestamp.reset();
               setCommentPage(1);
            },
         }
      );
   }, [commentTimestamp, audiobookId, commentMutation]);

   const handleReply = useCallback(
      (parentId: string, content: string, meta?: { position?: number }) => {
         commentMutation.mutate({ content, parentId, ...(meta ? { meta } : {}) });
      },
      [commentMutation]
   );

   const handleLoadMoreComments = useCallback(() => {
      if (commentsPagination?.hasNextPage && !isFetching) {
         setCommentPage((p) => p + 1);
      }
   }, [commentsPagination, isFetching]);

   const handleCreateNote = useCallback(() => {
      const title = noteTitle.trim();
      const content = noteContent.trim();
      if (!title || !content || !audiobookId) return;
      const position =
         playerAudiobookId === audiobookId ? Math.floor(playbackPosition) : 0;
      createNote.mutate(
         { title, content, position },
         {
            onSuccess: () => {
               setNoteModalVisible(false);
               setNoteTitle('');
               setNoteContent('');
            },
         }
      );
   }, [noteTitle, noteContent, audiobookId, createNote, playerAudiobookId, playbackPosition]);

   const listBottomPadding = spacing.lg;

   const inputBarBottomInset =
      keyboardBottomInset > 0 ? keyboardBottomInset : insets.bottom;

   const renderComments = () => {
      if (commentsLoading && allComments.length === 0) {
         return <SkeletonCommentRow count={6} />;
      }
      if (allComments.length === 0) {
         return (
            <View style={[styles.emptyState, { paddingBottom: listBottomPadding }]}>
               <Ionicons name="chatbubble-outline" size={48} color={colors.text.muted} />
               <Text style={styles.emptyTitle}>No comments yet</Text>
               <Text style={styles.emptyHint}>
                  Be the first to share your thoughts on this audiobook
               </Text>
            </View>
         );
      }
      return (
         <FlatList
            data={allComments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
               <CommentItem
                  comment={item}
                  audiobookId={audiobookId}
                  playerAudiobookId={playerAudiobookId}
                  playbackPosition={playbackPosition}
                  onReply={handleReply}
                  isReplying={replyingToId === item.id}
                  onStartReply={setReplyingToId}
                  onCancelReply={() => setReplyingToId(null)}
               />
            )}
            contentContainerStyle={{ paddingBottom: listBottomPadding }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onScrollBeginDrag={Keyboard.dismiss}
            ListFooterComponent={
               commentsPagination?.hasNextPage ? (
                  <TouchableOpacity
                     style={styles.loadMore}
                     onPress={handleLoadMoreComments}
                     disabled={isFetching}
                  >
                     {isFetching ? (
                        <ActivityIndicator size="small" color={colors.accent.primary} />
                     ) : (
                        <Text style={styles.loadMoreText}>Load more comments</Text>
                     )}
                  </TouchableOpacity>
               ) : null
            }
         />
      );
   };

   const renderNotes = () => {
      if (notesLoading) {
         return <SkeletonNoteCard count={4} />;
      }
      if (notes.length === 0) {
         return (
            <View style={[styles.emptyState, { paddingBottom: listBottomPadding + 72 }]}>
               <Ionicons name="document-text-outline" size={48} color={colors.text.muted} />
               <Text style={styles.emptyTitle}>No notes yet</Text>
               <Text style={styles.emptyHint}>Tap + to add a note for this audiobook</Text>
            </View>
         );
      }
      return (
         <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
               <NoteCard
                  note={item}
                  onDelete={(noteId) => removeNote.mutate(noteId)}
               />
            )}
            contentContainerStyle={{ paddingBottom: listBottomPadding + 72 }}
            keyboardShouldPersistTaps="handled"
         />
      );
   };

   return (
      <SafeAreaView style={styles.container} edges={['top']}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
               <View style={styles.dismissKeyboardArea}>
                  <ScreenHeader
                     headerIcon="chapter-comments"
                     title={chapterTitle}
                     subtitle={subtitle}
                     onBack={() => router.back()}
                  />

                  <TabUnderline
                     tabs={tabs}
                     activeKey={activeTab}
                     onTabPress={handleTabPress}
                  />

                  <TabSlideView
                     activeKey={activeTab}
                     tabKeys={['comments', 'notes']}
                     onTabChange={handleTabPress}
                     style={styles.flex}
                  >
                     {renderComments()}
                     {renderNotes()}
                  </TabSlideView>
               </View>
            </TouchableWithoutFeedback>

            {activeTab === 'comments' ? (
               <View style={{ paddingBottom: inputBarBottomInset }}>
                  {commentTimestamp.showNumericSuggestions && (
                     <TimestampNumericSuggestions
                        suggestions={commentTimestamp.numericSuggestions}
                        onSelect={commentTimestamp.selectNumericSuggestion}
                     />
                  )}
                  {commentTimestamp.showTimestampPicker &&
                     !commentTimestamp.showNumericSuggestions && (
                        <TimestampAtPicker
                           positionSeconds={commentTimestamp.currentPosition}
                           canUsePlayback={commentTimestamp.canUsePlayback}
                           onSelect={commentTimestamp.selectTimestamp}
                           onDismiss={commentTimestamp.dismissTimestampPicker}
                        />
                     )}
                  {commentTimestamp.hasTimestamp && !commentTimestamp.showTimestampPicker && (
                     <View style={styles.timestampBadge}>
                        <Ionicons name="time" size={14} color={colors.accent.primary} />
                        <Text style={styles.timestampBadgeText}>
                           Timestamp will be attached to your comment
                        </Text>
                     </View>
                  )}
                  <CommentInputBar
                     placeholder="Share your thoughts... Type @ to tag a time"
                     disabled={commentMutation.isPending}
                     value={commentTimestamp.text}
                     onChangeText={commentTimestamp.handleTextChange}
                     onSend={handlePostComment}
                     highlightTimestamps
                  />
               </View>
            ) : (
               <TouchableOpacity
                  style={[styles.fab, { bottom: insets.bottom + getTabBarFloatBottom() + spacing.md }]}
                  onPress={() => setNoteModalVisible(true)}
               >
                  <Ionicons name="add" size={28} color={colors.text.light} />
               </TouchableOpacity>
            )}

            <Modal
               visible={noteModalVisible}
               transparent
               animationType="slide"
               onRequestClose={() => setNoteModalVisible(false)}
            >
               <View style={styles.modalBackdrop}>
                  <View style={styles.modalCard}>
                     <Text style={styles.modalTitle}>New note</Text>
                     <TextInput
                        style={styles.modalInput}
                        placeholder="Title"
                        placeholderTextColor={colors.text.muted}
                        value={noteTitle}
                        onChangeText={setNoteTitle}
                     />
                     <TextInput
                        style={[styles.modalInput, styles.modalTextArea]}
                        placeholder="Content"
                        placeholderTextColor={colors.text.muted}
                        value={noteContent}
                        onChangeText={setNoteContent}
                        multiline
                     />
                     <View style={styles.modalActions}>
                        <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                           <Text style={styles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                           style={styles.modalSave}
                           onPress={handleCreateNote}
                           disabled={createNote.isPending}
                        >
                           <Text style={styles.modalSaveText}>Save</Text>
                        </TouchableOpacity>
                     </View>
                  </View>
               </View>
            </Modal>
      </SafeAreaView>
   );
}
