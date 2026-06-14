/**
 * Central TanStack Query key factories aligned with backend cacheQueryKeys.
 * SSE cache-invalidate events use these same key prefixes for invalidation.
 */

export const queryKeys = {
   audiobooks: {
      all: () => ['audiobooks'] as const,
      list: (page: number) => ['audiobooks', page] as const,
      detail: (id: string) => ['audiobooks', id] as const,
      byTag: (tagName: string, page: number) =>
         ['audiobooks', 'tag', tagName, page] as const,
      byGenre: (genreId: string, page: number) =>
         ['audiobooks', 'genre', genreId, page] as const,
      byMood: (moodId: string, page: number) =>
         ['audiobooks', 'mood', moodId, page] as const,
      search: (query: string) => ['audiobooks', 'search', query] as const,
      chapters: (audiobookId: string, page: number) =>
         ['audiobooks', audiobookId, 'chapters', page] as const,
      chaptersAll: (audiobookId: string) =>
         ['audiobooks', audiobookId, 'chapters'] as const,
      chapter: (audiobookId: string, chapterId: string) =>
         ['audiobooks', audiobookId, 'chapters', chapterId] as const,
      comments: (audiobookId: string, page: number, parentId?: string) =>
         ['audiobooks', audiobookId, 'comments', page, parentId ?? 'root'] as const,
      commentsAll: (audiobookId: string) =>
         ['audiobooks', audiobookId, 'comments'] as const,
      notes: (audiobookId: string) => ['audiobooks', audiobookId, 'notes'] as const,
   },

   tags: {
      all: () => ['tags'] as const,
      detail: (id: string) => ['tags', id] as const,
   },

   genres: {
      all: () => ['genres'] as const,
      detail: (id: string) => ['genres', id] as const,
   },

   moods: {
      all: () => ['moods'] as const,
      detail: (id: string) => ['moods', id] as const,
   },

   playlists: {
      all: () => ['playlists'] as const,
      me: (limit?: number) =>
         limit != null
            ? (['playlists', 'me', { limit }] as const)
            : (['playlists', 'me'] as const),
      detail: (id: string) => ['playlists', id] as const,
      items: (playlistId: string) => ['playlists', playlistId, 'items'] as const,
   },

   favorites: {
      all: () => ['favorites'] as const,
      me: (limit?: number) =>
         limit != null
            ? (['favorites', 'me', { limit }] as const)
            : (['favorites', 'me'] as const),
      byAudiobook: (audiobookId: string) =>
         ['favorites', 'me', 'audiobook', audiobookId] as const,
   },

   bookmarks: {
      all: () => ['bookmarks'] as const,
      me: (limit?: number) =>
         limit != null
            ? (['bookmarks', 'me', { limit }] as const)
            : (['bookmarks', 'me'] as const),
      byChapter: (chapterId: string) =>
         ['bookmarks', 'me', 'chapter', chapterId] as const,
   },

   organizations: {
      all: () => ['organizations'] as const,
      detail: (id: string) => ['organizations', id] as const,
      audiobooks: (organizationId: string, page: number) =>
         ['organizations', organizationId, 'audiobooks', page] as const,
   },

   userAudiobooks: {
      all: () => ['user-audiobooks'] as const,
      me: () => ['user-audiobooks', 'me'] as const,
   },

   subscriptions: {
      me: () => ['subscriptions', 'me'] as const,
   },

   subscriptionPlans: {
      all: () => ['subscription-plans'] as const,
   },

   /** Client-only keys — not emitted by backend SSE today */
   playback: {
      chapterProgress: (chapterId: string) =>
         ['playback', 'chapter-progress', chapterId] as const,
      continueListening: (audiobookId: string) =>
         ['playback', 'continue-listening', audiobookId] as const,
      continueListeningDiscover: (audiobookId: string) =>
         ['playback', 'continue-listening', 'discover', audiobookId] as const,
      listeningHistory: (userProfileId: string) =>
         ['playback', 'listening-history', userProfileId] as const,
   },

   streaming: {
      playlist: (chapterId: string, userId: string, preferredBitrateKbps?: number) =>
         ['streaming', 'playlist', chapterId, userId, preferredBitrateKbps ?? null] as const,
   },
} as const;
