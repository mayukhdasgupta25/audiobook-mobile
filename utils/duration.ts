/**
 * Duration formatting utility
 * Converts seconds to human-readable format
 */

/**
 * Format duration in seconds to human-readable string
 * Examples:
 * - 133 seconds → "2m 13s"
 * - 3600 seconds → "1h"
 * - 3661 seconds → "1h 1m 1s"
 * - 45 seconds → "45s"
 * 
 * @param seconds - Duration in seconds
 * @returns Human-readable duration string (e.g., "2h 30m", "45m", "30s")
 */
export function formatDuration(seconds: number): string {
   // Handle edge cases
   if (!Number.isFinite(seconds) || seconds < 0) {
      return '0s';
   }

   // Round to nearest integer
   const totalSeconds = Math.round(seconds);

   if (totalSeconds === 0) {
      return '0s';
   }

   // Calculate hours, minutes, and remaining seconds
   const hours = Math.floor(totalSeconds / 3600);
   const minutes = Math.floor((totalSeconds % 3600) / 60);
   const secs = totalSeconds % 60;

   // Build the formatted string
   const parts: string[] = [];

   // Add hours if present
   if (hours > 0) {
      parts.push(`${hours}h`);
   }

   // Add minutes if present (or if hours are present, always show minutes)
   if (minutes > 0 || hours > 0) {
      parts.push(`${minutes}m`);
   }

   // Add seconds only if there are no hours (to avoid clutter)
   // Or if there are hours but no minutes, show seconds
   if (hours === 0 && secs > 0) {
      parts.push(`${secs}s`);
   }

   return parts.join(' ') || '0s';
}

