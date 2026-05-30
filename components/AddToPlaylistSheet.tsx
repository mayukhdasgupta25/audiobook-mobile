import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
   View,
   Text,
   Modal,
   StyleSheet,
   TouchableOpacity,
   FlatList,
   ActivityIndicator,
   Pressable,
   Animated,
   Easing,
   Dimensions,
   BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import {
   BOTTOM_SHEET_SLIDE_SPRING,
   BOTTOM_SHEET_BACKDROP_FADE_MS,
   BOTTOM_SHEET_CLOSE_MS,
} from '@/theme/tabAnimation';
import {
   usePlaylists,
   usePlaylistMutations,
   usePlaylistItems,
} from '@/hooks/usePlaylists';
import { Playlist } from '@/services/playlists';

const SHEET_TRAVEL = Math.round(Dimensions.get('window').height * 0.55);

interface AddToPlaylistSheetProps {
   visible: boolean;
   audiobookId: string;
   onClose: () => void;
}

function PlaylistPickRow({
   playlist,
   audiobookId,
   onAdded,
}: {
   playlist: Playlist;
   audiobookId: string;
   onAdded: () => void;
}) {
   const { data: itemsData } = usePlaylistItems(playlist.id);
   const { addItem } = usePlaylistMutations();
   const items = itemsData?.data ?? [];
   const alreadyAdded = items.some((i) => i.audiobookId === audiobookId);

   const handleAdd = useCallback(() => {
      if (alreadyAdded || addItem.isPending) return;
      addItem.mutate(
         {
            playlistId: playlist.id,
            audiobookId,
            position: items.length + 1,
         },
         { onSuccess: onAdded }
      );
   }, [alreadyAdded, addItem, playlist.id, audiobookId, items.length, onAdded]);

   return (
      <TouchableOpacity
         style={styles.row}
         onPress={handleAdd}
         disabled={alreadyAdded || addItem.isPending}
         activeOpacity={0.7}
      >
         <Ionicons name="list" size={22} color={colors.accent.primary} />
         <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={1}>
               {playlist.name}
            </Text>
            {alreadyAdded && (
               <Text style={styles.rowHint}>Already in playlist</Text>
            )}
         </View>
         {addItem.isPending ? (
            <ActivityIndicator size="small" color={colors.accent.primary} />
         ) : (
            <Ionicons
               name={alreadyAdded ? 'checkmark-circle' : 'add-circle-outline'}
               size={22}
               color={alreadyAdded ? colors.success : colors.text.secondary}
            />
         )}
      </TouchableOpacity>
   );
}

export const AddToPlaylistSheet: React.FC<AddToPlaylistSheetProps> = ({
   visible,
   audiobookId,
   onClose,
}) => {
   const insets = useSafeAreaInsets();
   const { data, isLoading } = usePlaylists();
   const playlists = data?.data ?? [];

   const slideAnim = useRef(new Animated.Value(SHEET_TRAVEL)).current;
   const backdropOpacity = useRef(new Animated.Value(0)).current;
   const [isAnimating, setIsAnimating] = useState(false);
   const openAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
   const closeAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

   const runOpenAnimation = useCallback(() => {
      openAnimationRef.current?.stop();
      closeAnimationRef.current?.stop();
      slideAnim.setValue(SHEET_TRAVEL);
      backdropOpacity.setValue(0);
      setIsAnimating(true);

      requestAnimationFrame(() => {
         openAnimationRef.current = Animated.parallel([
            Animated.spring(slideAnim, {
               toValue: 0,
               ...BOTTOM_SHEET_SLIDE_SPRING,
            }),
            Animated.timing(backdropOpacity, {
               toValue: 1,
               duration: BOTTOM_SHEET_BACKDROP_FADE_MS,
               easing: Easing.out(Easing.cubic),
               useNativeDriver: true,
            }),
         ]);
         openAnimationRef.current.start(({ finished }) => {
            if (finished) {
               setIsAnimating(false);
            }
         });
      });
   }, [slideAnim, backdropOpacity]);

   const runCloseAnimation = useCallback(
      (onComplete?: () => void) => {
         openAnimationRef.current?.stop();
         closeAnimationRef.current?.stop();
         setIsAnimating(true);

         closeAnimationRef.current = Animated.parallel([
            Animated.timing(slideAnim, {
               toValue: SHEET_TRAVEL,
               duration: BOTTOM_SHEET_CLOSE_MS,
               easing: Easing.in(Easing.cubic),
               useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
               toValue: 0,
               duration: BOTTOM_SHEET_CLOSE_MS,
               easing: Easing.in(Easing.quad),
               useNativeDriver: true,
            }),
         ]);
         closeAnimationRef.current.start(({ finished }) => {
            if (finished) {
               setIsAnimating(false);
               onComplete?.();
            }
         });
      },
      [slideAnim, backdropOpacity]
   );

   const handleClose = useCallback(() => {
      runCloseAnimation(onClose);
   }, [runCloseAnimation, onClose]);

   useEffect(() => {
      if (visible) {
         runOpenAnimation();
      }
   }, [visible, runOpenAnimation]);

   useEffect(() => {
      if (!visible && !isAnimating) {
         return;
      }

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
         handleClose();
         return true;
      });

      return () => backHandler.remove();
   }, [visible, isAnimating, handleClose]);

   if (!visible && !isAnimating) {
      return null;
   }

   return (
      <Modal
         visible={visible || isAnimating}
         transparent
         animationType="none"
         statusBarTranslucent
         onRequestClose={handleClose}
      >
         <View style={styles.modalRoot}>
            <Pressable style={styles.backdropPressable} onPress={handleClose}>
               <Animated.View
                  style={[styles.backdrop, { opacity: backdropOpacity }]}
                  pointerEvents="none"
               />
            </Pressable>

            <Animated.View
               style={[
                  styles.sheet,
                  {
                     transform: [{ translateY: slideAnim }],
                     paddingBottom: Math.max(insets.bottom, spacing.md),
                  },
               ]}
            >
               <View style={styles.handle} />
               <Text style={styles.title}>Add to playlist</Text>
               {isLoading ? (
                  <ActivityIndicator
                     style={styles.loader}
                     color={colors.accent.primary}
                  />
               ) : playlists.length === 0 ? (
                  <Text style={styles.empty}>
                     Create a playlist in Library first.
                  </Text>
               ) : (
                  <FlatList
                     data={playlists}
                     keyExtractor={(item) => item.id}
                     style={styles.list}
                     renderItem={({ item }) => (
                        <PlaylistPickRow
                           playlist={item}
                           audiobookId={audiobookId}
                           onAdded={handleClose}
                        />
                     )}
                  />
               )}
               <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <Text style={styles.closeText}>Close</Text>
               </TouchableOpacity>
            </Animated.View>
         </View>
      </Modal>
   );
};

const styles = StyleSheet.create({
   modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
   },
   backdropPressable: {
      ...StyleSheet.absoluteFillObject,
   },
   backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
   },
   sheet: {
      backgroundColor: colors.background.screen,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 16,
   },
   handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border.light,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '700',
      color: colors.text.primary,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
   },
   list: {
      flexGrow: 0,
   },
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
   },
   rowText: {
      flex: 1,
   },
   rowTitle: {
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
   },
   rowHint: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
   },
   loader: {
      padding: spacing.xl,
   },
   empty: {
      padding: spacing.lg,
      color: colors.text.secondary,
      textAlign: 'center',
   },
   closeBtn: {
      marginTop: spacing.md,
      padding: spacing.md,
      alignItems: 'center',
   },
   closeText: {
      color: colors.accent.primary,
      fontWeight: '600',
   },
});
