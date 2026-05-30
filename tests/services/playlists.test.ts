import { createPlaylist, getPlaylists } from '@/services/playlists';
import { get, post } from '@/services/api';

jest.mock('@/services/api', () => ({
   API_V1_PATH: '/api/v1',
   get: jest.fn(),
   post: jest.fn(),
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

describe('playlists service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('getPlaylists appends limit query when provided', async () => {
      mockedGet.mockResolvedValue({
         data: { data: [] },
         status: 200,
         statusText: 'OK',
      });

      await getPlaylists({ limit: 8 });

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/playlists?limit=8', true);
   });

   it('createPlaylist always sends isPublic false', async () => {
      mockedPost.mockResolvedValue({
         data: {
            data: {
               id: 'pl-1',
               name: 'My List',
               description: 'Desc',
               isPublic: false,
            },
         },
         status: 201,
         statusText: 'Created',
      });

      await createPlaylist('My List', 'Desc');

      expect(mockedPost).toHaveBeenCalledWith(
         '/api/v1/playlists',
         {
            name: 'My List',
            description: 'Desc',
            isPublic: false,
         },
         true
      );
   });
});
