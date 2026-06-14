import { applyDomainCacheEvent } from '@/utils/applyDomainCacheEvent';
import {
   clearDeletedResources,
   isResourceDeleted,
} from '@/utils/deletedResourceRegistry';
import { queryClient } from '@/utils/queryClient';
import { queryKeys } from '@/constants/queryKeys';

jest.mock('@/utils/queryClient', () => ({
   queryClient: {
      cancelQueries: jest.fn(),
      removeQueries: jest.fn(),
      invalidateQueries: jest.fn(),
   },
}));

describe('applyDomainCacheEvent', () => {
   beforeEach(() => {
      jest.clearAllMocks();
      clearDeletedResources();
   });

   it('invalidates query keys for create/update events', () => {
      applyDomainCacheEvent({
         version: 1,
         service: 'app',
         resource: 'audiobook',
         action: 'updated',
         id: 'ab-1',
         queryKeys: [['audiobooks'], ['audiobooks', 'ab-1']],
         timestamp: '2026-06-13T00:00:00.000Z',
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
         predicate: expect.any(Function),
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
         queryKey: ['audiobooks', 'ab-1'],
      });
      expect(queryClient.removeQueries).not.toHaveBeenCalled();
   });

   it('removes deleted audiobook caches and refreshes list queries only', () => {
      applyDomainCacheEvent({
         version: 1,
         service: 'app',
         resource: 'audiobook',
         action: 'deleted',
         id: 'ab-1',
         queryKeys: [['audiobooks'], ['audiobooks', 'ab-1']],
         timestamp: '2026-06-13T00:00:00.000Z',
      });

      expect(isResourceDeleted('audiobooks', 'ab-1')).toBe(true);
      expect(queryClient.cancelQueries).toHaveBeenCalledWith({
         queryKey: ['audiobooks', 'ab-1'],
         exact: false,
      });
      expect(queryClient.removeQueries).toHaveBeenCalledWith({
         queryKey: ['audiobooks', 'ab-1'],
         exact: false,
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
         predicate: expect.any(Function),
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
         queryKey: queryKeys.favorites.me(),
      });
      expect(queryClient.invalidateQueries).not.toHaveBeenCalledWith({
         queryKey: ['audiobooks', 'ab-1'],
      });
   });

   it('removes deleted chapter caches and refreshes chapter lists', () => {
      applyDomainCacheEvent({
         version: 1,
         service: 'app',
         resource: 'chapter',
         action: 'deleted',
         id: 'ch-1',
         relatedIds: { audiobookId: 'ab-1' },
         queryKeys: [
            ['audiobooks', 'ab-1', 'chapters'],
            ['audiobooks', 'ab-1'],
            ['audiobooks'],
         ],
         timestamp: '2026-06-13T00:00:00.000Z',
      });

      expect(isResourceDeleted('chapters', 'ch-1')).toBe(true);
      expect(queryClient.removeQueries).toHaveBeenCalledWith({
         queryKey: ['audiobooks', 'ab-1', 'chapters', 'ch-1'],
         exact: false,
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
         queryKey: ['audiobooks', 'ab-1', 'chapters'],
      });
      expect(queryClient.invalidateQueries).not.toHaveBeenCalledWith({
         queryKey: ['audiobooks', 'ab-1', 'chapters', 'ch-1'],
      });
   });
});
