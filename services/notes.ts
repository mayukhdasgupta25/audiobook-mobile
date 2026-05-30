/**
 * Notes service
 */

import { get, post, del, ApiError, API_V1_PATH } from './api';

export interface Note {
   id: string;
   audiobookId: string;
   title: string;
   content: string;
   position: number;
   createdAt?: string;
   updatedAt?: string;
}

export interface CreateNoteRequest {
   audiobookId: string;
   title: string;
   content: string;
   position: number;
}

export interface NotesResponse {
   success: boolean;
   data: Note[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface NoteResponse {
   success: boolean;
   data: Note;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export async function getNotes(audiobookId: string): Promise<NotesResponse> {
   try {
      const response = await get<NotesResponse>(
         `${API_V1_PATH}/notes?audiobookId=${encodeURIComponent(audiobookId)}`,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch notes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function createNote(request: CreateNoteRequest): Promise<NoteResponse> {
   try {
      const response = await post<NoteResponse>(
         `${API_V1_PATH}/notes`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function deleteNote(noteId: string): Promise<void> {
   try {
      await del(`${API_V1_PATH}/notes/${noteId}`, true);
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to delete note: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
