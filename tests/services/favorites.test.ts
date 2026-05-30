import {
   getFavorites,
   getFavoriteByAudiobookId,
   createFavorite,
   deleteFavorite,
} from '@/services/favorites';
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

describe('favorites service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('getFavorites appends limit query when provided', async () => {
      mockedGet.mockResolvedValue({
         data: { data: [{ id: 'fav-1', audiobookId: 'book-1' }] },
         status: 200,
         statusText: 'OK',
      });

      const result = await getFavorites({ limit: 8 });

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/favorites?limit=8', true);
      expect(result).toHaveLength(1);
   });

   it('getFavoriteByAudiobookId requests with audiobookId query', async () => {
      mockedGet.mockResolvedValue({
         data: {
            data: { id: 'fav-1', audiobookId: 'book-1' },
         },
         status: 200,
         statusText: 'OK',
      });

      const result = await getFavoriteByAudiobookId('book-1');

      expect(mockedGet).toHaveBeenCalledWith(
         '/api/v1/favorites?audiobookId=book-1',
         true
      );
      expect(result).toEqual({ id: 'fav-1', audiobookId: 'book-1' });
   });

   it('createFavorite posts audiobookId', async () => {
      mockedPost.mockResolvedValue({
         data: { data: { id: 'fav-2', audiobookId: 'book-2' } },
         status: 201,
         statusText: 'Created',
      });

      await createFavorite({ audiobookId: 'book-2' });

      expect(mockedPost).toHaveBeenCalledWith(
         '/api/v1/favorites',
         { audiobookId: 'book-2' },
         true
      );
   });

   it('deleteFavorite calls DELETE with favorite id', async () => {
      mockedDel.mockResolvedValue({
         data: {},
         status: 200,
         statusText: 'OK',
      });

      await deleteFavorite('fav-99');

      expect(mockedDel).toHaveBeenCalledWith(
         '/api/v1/favorites/fav-99',
         true
      );
   });
});
