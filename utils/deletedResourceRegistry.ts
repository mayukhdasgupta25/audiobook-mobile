/**
 * Tracks resources removed via SSE delete events so active queries stop refetching.
 */

const deletedResources = new Map<string, Set<string>>();
const listeners = new Set<() => void>();

function scopeKey(scope: string): string {
   return scope;
}

function notifyListeners(): void {
   for (const listener of listeners) {
      listener();
   }
}

export function subscribeDeletedResources(listener: () => void): () => void {
   listeners.add(listener);
   return () => {
      listeners.delete(listener);
   };
}

export function markResourceDeleted(scope: string, id: string): void {
   const key = scopeKey(scope);
   const ids = deletedResources.get(key) ?? new Set<string>();
   if (ids.has(id)) {
      return;
   }
   ids.add(id);
   deletedResources.set(key, ids);
   notifyListeners();
}

export function isResourceDeleted(scope: string, id: string): boolean {
   return deletedResources.get(scopeKey(scope))?.has(id) ?? false;
}

export function clearResourceDeleted(scope: string, id: string): void {
   const ids = deletedResources.get(scopeKey(scope));
   if (!ids?.delete(id)) {
      return;
   }
   notifyListeners();
}

export function clearDeletedResources(scope?: string): void {
   if (scope) {
      if (!deletedResources.delete(scopeKey(scope))) {
         return;
      }
   } else {
      if (deletedResources.size === 0) {
         return;
      }
      deletedResources.clear();
   }
   notifyListeners();
}

export function getDeletedResourceIds(scope: string): readonly string[] {
   return Array.from(deletedResources.get(scopeKey(scope)) ?? []);
}
