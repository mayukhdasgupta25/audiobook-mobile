/**
 * Formatting utilities for display strings
 */

/**
 * Format ISO date for account screens (e.g. "20 June 2026")
 */
export function formatAccountDate(iso: string): string {
   try {
      const date = new Date(iso);
      return date.toLocaleDateString('en-US', {
         day: 'numeric',
         month: 'long',
         year: 'numeric',
      });
   } catch {
      return iso;
   }
}

/**
 * Format plan price with currency code from API
 */
export function formatPlanPrice(price: number, currency: string): string {
   try {
      return new Intl.NumberFormat('en-IN', {
         style: 'currency',
         currency,
         minimumFractionDigits: 0,
         maximumFractionDigits: 2,
      }).format(price);
   } catch {
      return `${currency} ${price}`;
   }
}
