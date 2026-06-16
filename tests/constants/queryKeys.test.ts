import { queryKeys } from '@/constants/queryKeys';

describe('queryKeys', () => {
   it('matches backend audiobook detail keys', () => {
      expect(queryKeys.audiobooks.detail('ab-1')).toEqual(['audiobooks', 'ab-1']);
   });

   it('matches backend chapter list keys under audiobook prefix', () => {
      expect(queryKeys.audiobooks.chapters('ab-1', 2)).toEqual([
         'audiobooks',
         'ab-1',
         'chapters',
         2,
      ]);
      expect(queryKeys.audiobooks.chaptersAll('ab-1')).toEqual([
         'audiobooks',
         'ab-1',
         'chapters',
      ]);
   });

   it('matches backend playlist item keys', () => {
      expect(queryKeys.playlists.items('pl-1')).toEqual(['playlists', 'pl-1', 'items']);
   });

   it('matches backend favorites me keys', () => {
      expect(queryKeys.favorites.me()).toEqual(['favorites', 'me']);
   });

   it('matches backend organization keys', () => {
      expect(queryKeys.organizations.detail('org-1')).toEqual(['organizations', 'org-1']);
   });

   it('uses client-only playback namespace', () => {
      expect(queryKeys.playback.chapterProgress('ch-1')).toEqual([
         'playback',
         'chapter-progress',
         'ch-1',
      ]);
   });
});
