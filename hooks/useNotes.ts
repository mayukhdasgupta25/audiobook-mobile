import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   getNotes,
   createNote,
   deleteNote,
   CreateNoteRequest,
} from '@/services/notes';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function useNotes(audiobookId: string) {
   const enabled = useAuthQueryEnabled(!!audiobookId);

   return useQuery({
      queryKey: ['notes', audiobookId],
      queryFn: () => getNotes(audiobookId),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 30 * 1000,
   });
}

export function useNoteMutations(audiobookId: string) {
   const queryClient = useQueryClient();

   const create = useMutation({
      mutationFn: (request: Omit<CreateNoteRequest, 'audiobookId'>) =>
         createNote({ audiobookId, ...request }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['notes', audiobookId] });
      },
   });

   const remove = useMutation({
      mutationFn: (noteId: string) => deleteNote(noteId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['notes', audiobookId] });
      },
   });

   return { create, remove };
}
