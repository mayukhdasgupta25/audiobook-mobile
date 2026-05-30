import {
   getBookmarks,
   getBookmarkByChapterId,
   createBookmark,
   deleteBookmark,
} from '@/services/bookmarks';
import { get, post, del } from '@/services/api';

jest.mock('@/services/api', () => ({
   API_V1_PATH: '/api/v1',
   get: jest.fn(),
   post: jest.fn(),
   del: jest.fn(),
   ApiError: class ApiError extends Error {
      status: number;
      constructor(message: string, status: number) {
         super(message);
         this.status = status;
      }
   },
}));

const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedDel = del as jest.MockedFunction<typeof del>;

describe('bookmarks service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('getBookmarks appends limit query when provided', async () => {
      mockedGet.mockResolvedValue({
         data: { data: [] },
         status: 200,
         statusText: 'OK',
      });

      await getBookmarks({ limit: 8 });

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/bookmarks?limit=8', true);
   });

   it('getBookmarks filters by chapterId', async () => {
      mockedGet.mockResolvedValue({
         data: {
            data: [{ id: 'bm-1', chapterId: 'ch-1' }],
         },
         status: 200,
         statusText: 'OK',
      });

      const result = await getBookmarks({ chapterId: 'ch-1' });

      expect(mockedGet).toHaveBeenCalledWith(
         '/api/v1/bookmarks?chapterId=ch-1',
         true
      );
      expect(result).toHaveLength(1);
   });

   it('getBookmarks filters by audiobookId', async () => {
      mockedGet.mockResolvedValue({
         data: { data: [] },
         status: 200,
         statusText: 'OK',
      });

      await getBookmarks({ audiobookId: 'book-1' });

      expect(mockedGet).toHaveBeenCalledWith(
         '/api/v1/bookmarks?audiobookId=book-1',
         true
      );
   });

   it('getBookmarkByChapterId returns first match', async () => {
      mockedGet.mockResolvedValue({
         data: {
            data: [{ id: 'bm-2', chapterId: 'ch-2' }],
         },
         status: 200,
         statusText: 'OK',
      });

      const result = await getBookmarkByChapterId('ch-2');

      expect(result).toEqual({ id: 'bm-2', chapterId: 'ch-2' });
   });

   it('createBookmark posts chapterId only', async () => {
      mockedPost.mockResolvedValue({
         data: { data: { id: 'bm-3', chapterId: 'ch-3' } },
         status: 201,
         statusText: 'Created',
      });

      await createBookmark({ chapterId: 'ch-3' });

      expect(mockedPost).toHaveBeenCalledWith(
         '/api/v1/bookmarks',
         { chapterId: 'ch-3' },
         true
      );
   });

   it('deleteBookmark calls DELETE with bookmark id', async () => {
      mockedDel.mockResolvedValue({
         data: {},
         status: 200,
         statusText: 'OK',
      });

      await deleteBookmark('bm-99');

      expect(mockedDel).toHaveBeenCalledWith('/api/v1/bookmarks/bm-99', true);
   });
});
