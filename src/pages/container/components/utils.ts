import { Containers } from './types';
export const ensureTrim = (v?: string) => (v ?? '').trim();

export function validateForm(form: Omit<Containers, '_id'>): string | null {
  const num = ensureTrim(form.containerNumber);
  if (!num) return 'Container Number is required';
  if (num.length < 3) return 'Container Number must be at least 3 characters';
  return null;
}