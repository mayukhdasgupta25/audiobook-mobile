/**
 * Registration validation helpers aligned with auth-service rules
 */

const INDIAN_MOBILE_REGEX = /^(\+91[\-\s]?)?[0]?[6-9]\d{9}$/;

export function validateIndianContact(contact: string): string | null {
   const trimmed = contact.trim();
   if (!trimmed) {
      return 'Contact number is required';
   }
   const normalized = trimmed.replace(/[\s-]/g, '');
   if (!INDIAN_MOBILE_REGEX.test(normalized)) {
      return 'Please enter a valid Indian mobile number';
   }
   return null;
}

export function validateRegistrationPassword(password: string): string | null {
   if (password.length < 8) {
      return 'Password must be at least 8 characters long';
   }
   if (!/[A-Z]/.test(password)) {
      return 'Password must include at least one uppercase letter';
   }
   if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Password must include both letters and numbers';
   }
   if (!/[^A-Za-z0-9]/.test(password)) {
      return 'Password must include at least one symbol';
   }
   return null;
}
