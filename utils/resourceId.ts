/**
 * Normalize persisted or URL-derived resource IDs.
 * Treats empty strings and literal "null"/"undefined" as missing.
 */
export function normalizeResourceId(
   id: string | null | undefined
): string | null {
   if (id == null) {
      return null;
   }

   const trimmed = id.trim();
   if (trimmed.length === 0 || trimmed === 'null' || trimmed === 'undefined') {
      return null;
   }

   return trimmed;
}
