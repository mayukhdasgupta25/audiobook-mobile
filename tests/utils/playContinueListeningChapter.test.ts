import { playContinueListeningChapter } from '@/utils/playContinueListeningChapter';
import { getChapterById } from '@/services/audiobooks';
import { fetchAllChapters, switchToChapter } from '@/utils/chapterNavigation';

const mockGetState = jest.fn();
const mockPlay = jest.fn(() => ({ type: 'player/play' }));

jest.mock('@/store', () => ({
   store: {
      getState: () => mockGetState(),
   },
}));

jest.mock('@/store/player', () => ({
   play: (...args: unknown[]) => mockPlay(...args),
}));

jest.mock('@/services/audiobooks', () => ({
   getChapterById: jest.fn(),
}));

jest.mock('@/utils/chapterNavigation', () => ({
   fetchAllChapters: jest.fn(),
   switchToChapter: jest.fn(),
}));

const mockedGetChapterById = getChapterById as jest.MockedFunction<typeof getChapterById>;
const mockedFetchAllChapters = fetchAllChapters as jest.MockedFunction<typeof fetchAllChapters>;
const mockedSwitchToChapter = switchToChapter as jest.MockedFunction<typeof switchToChapter>;

describe('playContinueListeningChapter', () => {
   const dispatch = jest.fn();

   beforeEach(() => {
      jest.clearAllMocks();
      mockGetState.mockReturnValue({
         player: {
            currentChapterId: null,
            audiobookId: null,
         },
      });
   });

   it('resumes playback when the chapter is already loaded', async () => {
      mockGetState.mockReturnValue({
         player: {
            currentChapterId: 'chapter-1',
            audiobookId: 'book-1',
         },
      });

      const result = await playContinueListeningChapter('book-1', 'chapter-1', dispatch);

      expect(result).toBe(true);
      expect(mockPlay).toHaveBeenCalled();
      expect(mockedGetChapterById).not.toHaveBeenCalled();
   });

   it('loads the chapter and starts playback when not already active', async () => {
      const chapter = {
         id: 'chapter-2',
         audiobookId: 'book-1',
      };

      mockedGetChapterById.mockResolvedValue(chapter as Awaited<ReturnType<typeof getChapterById>>);
      mockedFetchAllChapters.mockResolvedValue([chapter] as Awaited<ReturnType<typeof fetchAllChapters>>);

      const result = await playContinueListeningChapter('book-1', 'chapter-2', dispatch);

      expect(result).toBe(true);
      expect(mockedSwitchToChapter).toHaveBeenCalledWith(dispatch, chapter, {
         totalChapters: 1,
      });
   });
});
