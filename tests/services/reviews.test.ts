import { createReview } from '@/services/reviews';
import { post } from '@/services/api';

jest.mock('@/services/api', () => ({
   API_V1_PATH: '/api/v1',
   post: jest.fn(),
   ApiError: class ApiError extends Error {
      status: number;
      constructor(message: string, status: number) {
         super(message);
         this.status = status;
      }
   },
}));

const mockedPost = post as jest.MockedFunction<typeof post>;

describe('reviews service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('createReview posts audiobookId and rating', async () => {
      mockedPost.mockResolvedValue({
         data: {
            data: { id: 'r1', audiobookId: 'book-1', rating: 4 },
         },
         status: 201,
         statusText: 'Created',
      });

      await createReview({ audiobookId: 'book-1', rating: 4 });

      expect(mockedPost).toHaveBeenCalledWith(
         '/api/v1/reviews',
         { audiobookId: 'book-1', rating: 4 },
         true
      );
   });
});
