import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   getPlaylists,
   createPlaylist,
   updatePlaylist,
   deletePlaylist,
   getPlaylistItems,
   addPlaylistItem,
   updatePlaylistItem,
   deletePlaylistItem,
   UpdatePlaylistRequest,
   AddPlaylistItemRequest,
} from '@/services/playlists';
import { queryKeys } from '@/constants/queryKeys';
import { isNotFoundError } from '@/utils/isNotFoundError';
import { shouldRetryQuery } from '@/utils/queryRetry';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useResourceDeleted } from './useResourceDeleted';
import { showToast } from '@/utils/toast';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export function usePlaylists(limit?: number) {
   const enabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: queryKeys.playlists.me(limit),
      queryFn: () => getPlaylists(limit != null ? { limit } : undefined),
      enabled,
      retry: shouldRetryQuery,
   });
}

export function usePlaylistItems(playlistId: string) {
   const isDeleted = useResourceDeleted('playlists', playlistId);
   const enabled = useAuthQueryEnabled(!!playlistId && !isDeleted);

   const query = useQuery({
      queryKey: queryKeys.playlists.items(playlistId),
      queryFn: () => getPlaylistItems(playlistId),
      enabled,
      retry: shouldRetryQuery,
      meta: { silent404: true },
   });

   const isNotFound =
      isDeleted || isNotFoundError(query.error);

   return {
      ...query,
      isNotFound,
   };
}

export function usePlaylistMutations() {
   const queryClient = useQueryClient();

   const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all() });
   };

   const create = useMutation({
      mutationFn: ({ name, description }: { name: string; description: string }) =>
         createPlaylist(name, description),
      onSuccess: () => {
         invalidateAll();
         showToast({ message: 'Playlist created', type: 'success' });
      },
      onError: (error) => {
         showToast({ message: getApiErrorMessage(error), type: 'error' });
      },
   });

   const update = useMutation({
      mutationFn: ({
         playlistId,
         ...body
      }: { playlistId: string } & UpdatePlaylistRequest) =>
         updatePlaylist(playlistId, body),
      onSuccess: invalidateAll,
   });

   const remove = useMutation({
      mutationFn: (playlistId: string) => deletePlaylist(playlistId),
      onSuccess: invalidateAll,
   });

   const addItem = useMutation({
      mutationFn: ({
         playlistId,
         ...body
      }: { playlistId: string } & AddPlaylistItemRequest) =>
         addPlaylistItem(playlistId, body),
      onSuccess: (_data, variables) => {
         queryClient.invalidateQueries({
            queryKey: queryKeys.playlists.items(variables.playlistId),
         });
         showToast({ message: 'Added to playlist', type: 'success' });
      },
      onError: (error) => {
         showToast({ message: getApiErrorMessage(error), type: 'error' });
      },
   });

   const reorderItem = useMutation({
      mutationFn: ({
         playlistId,
         itemId,
         position,
      }: {
         playlistId: string;
         itemId: string;
         position: number;
      }) => updatePlaylistItem(playlistId, itemId, { position }),
      onSuccess: (_data, variables) => {
         queryClient.invalidateQueries({
            queryKey: queryKeys.playlists.items(variables.playlistId),
         });
      },
   });

   const removeItem = useMutation({
      mutationFn: ({
         playlistId,
         itemId,
      }: {
         playlistId: string;
         itemId: string;
      }) => deletePlaylistItem(playlistId, itemId),
      onSuccess: (_data, variables) => {
         queryClient.invalidateQueries({
            queryKey: queryKeys.playlists.items(variables.playlistId),
         });
      },
   });

   return { create, update, remove, addItem, reorderItem, removeItem };
}
