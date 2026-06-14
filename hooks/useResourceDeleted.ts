import { useEffect, useState, useSyncExternalStore } from 'react';
import {
   isResourceDeleted,
   subscribeDeletedResources,
} from '@/utils/deletedResourceRegistry';

let deletedRevision = 0;

function subscribeDeletedRevision(onStoreChange: () => void): () => void {
   return subscribeDeletedResources(() => {
      deletedRevision += 1;
      onStoreChange();
   });
}

function getDeletedRevisionSnapshot(): number {
   return deletedRevision;
}

/** Bumps when any resource is marked deleted — use to refresh query `enabled` flags. */
export function useDeletedResourcesRevision(): number {
   return useSyncExternalStore(
      subscribeDeletedRevision,
      getDeletedRevisionSnapshot,
      getDeletedRevisionSnapshot
   );
}

export function useResourceDeleted(scope: string, id: string): boolean {
   useDeletedResourcesRevision();
   return isResourceDeleted(scope, id);
}

/** Imperative hook for screens that need to react once a resource becomes deleted. */
export function useOnResourceDeleted(
   scope: string,
   id: string,
   onDeleted: () => void
): void {
   const [seen, setSeen] = useState(false);

   useEffect(() => {
      if (!id) {
         return;
      }

      const check = (): void => {
         if (isResourceDeleted(scope, id) && !seen) {
            setSeen(true);
            onDeleted();
         }
      };

      check();
      return subscribeDeletedResources(check);
   }, [scope, id, onDeleted, seen]);
}
