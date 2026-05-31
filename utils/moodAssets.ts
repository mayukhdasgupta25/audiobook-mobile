import type { SvgProps } from 'react-native-svg';
import type { FC } from 'react';
import {
   MOOD_ATTRIBUTE_ICON_REGISTRY,
   MOOD_DESCRIPTION_ICON_REGISTRY,
   MOOD_ICON_REGISTRY,
   type MoodSvgComponent,
} from '@/constants/moodIconRegistry';

export function normalizeMoodKey(name: string | null | undefined): string {
   if (!name) {
      return '';
   }
   return name
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
}

function resolveFromRegistry(
   registry: Record<string, MoodSvgComponent>,
   name: string | null | undefined
): FC<SvgProps> | null {
   const key = normalizeMoodKey(name);
   if (!key) {
      return null;
   }
   return registry[key] ?? null;
}

export function getMoodIconComponent(name: string): FC<SvgProps> | null {
   return resolveFromRegistry(MOOD_ICON_REGISTRY, name);
}

export function getMoodAttributeIconComponent(
   iconName: string | null | undefined
): FC<SvgProps> | null {
   return resolveFromRegistry(MOOD_ATTRIBUTE_ICON_REGISTRY, iconName);
}

export function getMoodDescriptionIconComponent(name: string): FC<SvgProps> | null {
   return resolveFromRegistry(MOOD_DESCRIPTION_ICON_REGISTRY, name);
}

/** Ensure hex color has a leading # for display and SVG tinting */
export function normalizeHexCode(hex: string | null | undefined): string {
   const trimmed = hex?.trim() ?? '';
   if (!trimmed) {
      return '#6F431B';
   }
   return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

/** Convert hex to rgba for light background tints */
export function hexToRgba(hex: string, alpha: number): string {
   const normalized = normalizeHexCode(hex).replace('#', '');
   const value =
      normalized.length === 3
         ? normalized
              .split('')
              .map((char) => char + char)
              .join('')
         : normalized.slice(0, 6);

   const r = parseInt(value.slice(0, 2), 16);
   const g = parseInt(value.slice(2, 4), 16);
   const b = parseInt(value.slice(4, 6), 16);

   if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return `rgba(111, 67, 27, ${alpha})`;
   }

   return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Display label: first character upper case, rest lower case */
export function toSentenceCase(value: string): string {
   const normalized = value.trim().replace(/[-_]+/g, ' ');
   if (!normalized) {
      return '';
   }
   const lower = normalized.toLowerCase();
   return lower.charAt(0).toUpperCase() + lower.slice(1);
}
