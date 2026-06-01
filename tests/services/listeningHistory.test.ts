import { getListeningHistoryByProfileId } from '@/services/listeningHistory';
import { get } from '@/services/api';

jest.mock('@/services/api', () => ({
   get: jest.fn(),
   API_V1_PATH: '/api/v1',
}));

const mockedGet = get as jest.MockedFunction<typeof get>;

describe('listeningHistory service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('fetches listening history for a user profile', async () => {
      mockedGet.mockResolvedValue({
         data: {
            success: true,
            data: [
               {
                  id: 'hist-1',
                  userProfileId: 'profile-1',
                  audiobookId: 'book-1',
                  completed: true,
                  progress: 840,
               },
            ],
         },
      } as never);

      const result = await getListeningHistoryByProfileId('profile-1');

      expect(mockedGet).toHaveBeenCalledWith(
         '/api/v1/listening-history/user/profile-1',
         true
      );
      expect(result).toHaveLength(1);
      expect(result[0].completed).toBe(true);
   });
});
