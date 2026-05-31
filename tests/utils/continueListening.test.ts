import {
   buildContinueListeningProgress,
   findMostRecentChapterProgress,
} from '@/utils/continueListening';
import { getChapterProgress, type Chapter } from '@/services/audiobooks';

jest.mock('@/services/audiobooks', () => ({
   getChapterProgress: jest.fn(),
}));

const mockedGetChapterProgress = getChapterProgress as jest.MockedFunction<
   typeof getChapterProgress
>;

const chapterA: Chapter = {
   id: 'chapter-a',
   audiobookId: 'book-1',
   title: 'Chapter A',
   description: '',
   chapterNumber: 1,
   duration: 600,
   filePath: '',
   fileSize: 0,
   coverImage: '',
   chapterCardCoverImage: null,
   maximizedChapterCoverImage: null,
   minimizedChapterCoverImage: null,
   startPosition: 0,
   endPosition: 600,
   isActive: true,
   scheduledAt: null,
   createdAt: '',
   updatedAt: '',
   audiobook: { id: 'book-1', title: 'Book', author: 'Author' },
   bookmarks: [],
   notes: [],
   chapterProgress: [],
};

const chapterB: Chapter = {
   ...chapterA,
   id: 'chapter-b',
   title: 'Chapter B',
   chapterNumber: 2,
   duration: 900,
};

describe('continueListening utils', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   describe('buildContinueListeningProgress', () => {
      it('returns ratio clamped between 0 and 1', () => {
         expect(buildContinueListeningProgress(300, 600)).toBe(0.5);
         expect(buildContinueListeningProgress(0, 600)).toBe(0);
         expect(buildContinueListeningProgress(700, 600)).toBe(1);
      });
   });

   describe('findMostRecentChapterProgress', () => {
      it('returns the chapter with the latest lastListenedAt and progress > 0', async () => {
         mockedGetChapterProgress.mockImplementation(async (chapterId) => {
            if (chapterId === 'chapter-a') {
               return {
                  id: 'progress-a',
                  userProfileId: 'user-1',
                  chapterId: 'chapter-a',
                  currentPosition: 120,
                  completed: false,
                  lastListenedAt: '2026-01-01T10:00:00.000Z',
                  createdAt: '',
                  updatedAt: '',
               };
            }
            return {
               id: 'progress-b',
               userProfileId: 'user-1',
               chapterId: 'chapter-b',
               currentPosition: 450,
               completed: false,
               lastListenedAt: '2026-01-02T10:00:00.000Z',
               createdAt: '',
               updatedAt: '',
            };
         });

         const result = await findMostRecentChapterProgress([chapterA, chapterB]);
         expect(result?.chapterId).toBe('chapter-b');
         expect(result?.currentPosition).toBe(450);
      });

      it('ignores completed chapters and zero progress', async () => {
         mockedGetChapterProgress.mockResolvedValueOnce({
            id: 'progress-a',
            userProfileId: 'user-1',
            chapterId: 'chapter-a',
            currentPosition: 0,
            completed: false,
            lastListenedAt: '2026-01-02T10:00:00.000Z',
            createdAt: '',
            updatedAt: '',
         });

         const result = await findMostRecentChapterProgress([chapterA]);
         expect(result).toBeNull();
      });
   });
});
