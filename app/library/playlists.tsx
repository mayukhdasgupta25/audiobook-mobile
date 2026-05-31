import React, { useCallback, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PlaylistCard, PLAYLIST_CARD_WIDTH } from '@/components/PlaylistCard';
import { CreatePlaylistModal } from '@/components/CreatePlaylistModal';
import { SkeletonGrid } from '@/components/skeleton';
import { usePlaylists, usePlaylistMutations } from '@/hooks/usePlaylists';
import { colors, spacing, typography } from '@/theme';
import { GRID_GAP, GRID_PADDING, NUM_COLUMNS } from '@/components/AudiobookGridCard';

export default function LibraryPlaylistsScreen() {
   const [createModalVisible, setCreateModalVisible] = useState(false);
   const { data, isLoading } = usePlaylists();
   const { create } = usePlaylistMutations();
   const playlists = data?.data ?? [];

   const handleCreate = useCallback(
      (name: string, description: string) => {
         create.mutate(
            { name, description },
            {
               onSuccess: (res) => {
                  setCreateModalVisible(false);
                  router.push(`/playlists/${res.data.id}` as never);
               },
            }
         );
      },
      [create]
   );

   const renderItem = useCallback(
      ({ item }: { item: (typeof playlists)[number] }) => (
         <View style={styles.gridItem}>
            <PlaylistCard
               playlist={item}
               onPress={() => router.push(`/playlists/${item.id}` as never)}
            />
         </View>
      ),
      []
   );

   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <ScreenHeader
            title="Playlists"
            onBack={() => router.back()}
            rightActions={
               <TouchableOpacity
                  onPress={() => setCreateModalVisible(true)}
                  style={styles.addButton}
                  activeOpacity={0.8}
               >
                  <Ionicons name="add" size={24} color="#fff" />
               </TouchableOpacity>
            }
         />

         {isLoading ? (
            <SkeletonGrid rows={3} cardAspect={1} />
         ) : (
            <FlatList
               data={playlists}
               keyExtractor={(item) => item.id}
               renderItem={renderItem}
               numColumns={NUM_COLUMNS}
               columnWrapperStyle={styles.columnWrapper}
               contentContainerStyle={styles.listContent}
               ListEmptyComponent={
                  <View style={styles.center}>
                     <Text style={styles.emptyText}>No playlists yet</Text>
                     <Text style={styles.emptyHint}>Tap + to create your first playlist</Text>
                  </View>
               }
            />
         )}

         <CreatePlaylistModal
            visible={createModalVisible}
            onClose={() => setCreateModalVisible(false)}
            onCreate={handleCreate}
            isPending={create.isPending}
         />
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
   },
   listContent: {
      paddingHorizontal: GRID_PADDING,
      paddingBottom: spacing.xxl,
   },
   columnWrapper: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
   },
   gridItem: {
      width: PLAYLIST_CARD_WIDTH,
   },
   center: {
      flex: 1,
      padding: spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
   },
   emptyText: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      ...Platform.select({
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   emptyHint: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing.sm,
      textAlign: 'center',
   },
});
