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
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export type PlaylistsQueryKey = ['playlists', { limit?: number } | 'all'];

export function playlistsQueryKey(limit?: number): PlaylistsQueryKey {
   if (limit != null) {
      return ['playlists', { limit }];
   }
   return ['playlists', 'all'];
}

export function usePlaylists(limit?: number) {
   const enabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: playlistsQueryKey(limit),
      queryFn: () => getPlaylists(limit != null ? { limit } : undefined),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 60 * 1000,
   });
}

export function usePlaylistItems(playlistId: string) {
   const enabled = useAuthQueryEnabled(!!playlistId);

   return useQuery({
      queryKey: ['playlistItems', playlistId],
      queryFn: () => getPlaylistItems(playlistId),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 30 * 1000,
   });
}

export function usePlaylistMutations() {
   const queryClient = useQueryClient();

   const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlistItems'] });
   };

   const create = useMutation({
      mutationFn: ({ name, description }: { name: string; description: string }) =>
         createPlaylist(name, description),
      onSuccess: invalidateAll,
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
         queryClient.invalidateQueries({ queryKey: ['playlistItems', variables.playlistId] });
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
         queryClient.invalidateQueries({ queryKey: ['playlistItems', variables.playlistId] });
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
         queryClient.invalidateQueries({ queryKey: ['playlistItems', variables.playlistId] });
      },
   });

   return { create, update, remove, addItem, reorderItem, removeItem };
}
