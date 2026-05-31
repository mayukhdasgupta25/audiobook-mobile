import type { SvgProps } from 'react-native-svg';
import type { FC } from 'react';
import {
   MOOD_ATTRIBUTE_ICON_REGISTRY,
   MOOD_DESCRIPTION_ICON_REGISTRY,
   MOOD_ICON_REGISTRY,
   type MoodSvgComponent,
} from '@/constants/moodIconRegistry';

const DEFAULT_MOOD_HEX = '#6F431B';
const LOW_LUMINANCE_THRESHOLD = 0.15;
const TARGET_MIN_LUMINANCE = 0.35;
const DEFAULT_PILL_TINT_ALPHA = 0.12;
const BOOSTED_PILL_TINT_ALPHA = 0.32;

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
      return DEFAULT_MOOD_HEX;
   }
   return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
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
      return null;
   }

   return { r, g, b };
}

function channelToLinear(channel: number): number {
   const normalized = channel / 255;
   return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance 0–1 (WCAG) */
export function getHexLuminance(hex: string): number {
   const rgb = parseHexRgb(hex);
   if (!rgb) {
      return 0;
   }

   const r = channelToLinear(rgb.r);
   const g = channelToLinear(rgb.g);
   const b = channelToLinear(rgb.b);
   return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbToHex(r: number, g: number, b: number): string {
   const toHex = (value: number) =>
      Math.round(Math.min(255, Math.max(0, value)))
         .toString(16)
         .padStart(2, '0');
   return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function blendHexColors(source: string, target: string, amount: number): string {
   const sourceRgb = parseHexRgb(source);
   const targetRgb = parseHexRgb(target);
   if (!sourceRgb || !targetRgb) {
      return normalizeHexCode(target);
   }

   const ratio = Math.min(1, Math.max(0, amount));
   return rgbToHex(
      sourceRgb.r + (targetRgb.r - sourceRgb.r) * ratio,
      sourceRgb.g + (targetRgb.g - sourceRgb.g) * ratio,
      sourceRgb.b + (targetRgb.b - sourceRgb.b) * ratio
   );
}

function lightenHexToMinLuminance(
   hex: string,
   targetHex: string,
   minLuminance: number
): string {
   const normalized = normalizeHexCode(hex);
   if (getHexLuminance(normalized) >= minLuminance) {
      return normalized;
   }

   let blended = normalized;
   for (let step = 1; step <= 10; step += 1) {
      blended = blendHexColors(normalized, targetHex, step / 10);
      if (getHexLuminance(blended) >= minLuminance) {
         return blended;
      }
   }

   return normalizeHexCode(targetHex);
}

function isNamedDarkMood(moodName: string | null | undefined): boolean {
   return normalizeMoodKey(moodName) === 'dark';
}

/** True when a mood color is too dark to read on dark app surfaces */
export function isLowContrastMoodColor(hex: string, isDark: boolean): boolean {
   if (!isDark) {
      return false;
   }
   return getHexLuminance(normalizeHexCode(hex)) < LOW_LUMINANCE_THRESHOLD;
}

/**
 * Resolves icon/title tint for display.
 * - Dark app + mood name "dark" → accent fallback
 * - Dark app + low luminance hex → lighten toward accent.primary
 * - Otherwise → normalized API hex
 */
export function resolveMoodDisplayColor(
   hex: string,
   options: { isDark: boolean; moodName?: string; fallbackAccent?: string }
): string {
   const normalized = normalizeHexCode(hex);
   const fallbackAccent = normalizeHexCode(options.fallbackAccent ?? DEFAULT_MOOD_HEX);

   if (options.isDark && isNamedDarkMood(options.moodName)) {
      return fallbackAccent;
   }

   if (options.isDark && isLowContrastMoodColor(normalized, true)) {
      return lightenHexToMinLuminance(normalized, fallbackAccent, TARGET_MIN_LUMINANCE);
   }

   return normalized;
}

/** Chip/card tint background with boosted alpha for low-luminance moods in dark mode */
export function resolveMoodTintBackground(
   hex: string,
   options: {
      isDark: boolean;
      moodName?: string;
      variant: 'pill' | 'card';
      fallbackAccent?: string;
   }
): string {
   const displayColor = resolveMoodDisplayColor(hex, {
      isDark: options.isDark,
      moodName: options.moodName,
      fallbackAccent: options.fallbackAccent,
   });

   const needsBoost =
      options.isDark &&
      (isNamedDarkMood(options.moodName) || isLowContrastMoodColor(hex, true));

   const alpha =
      options.variant === 'pill'
         ? needsBoost
            ? BOOSTED_PILL_TINT_ALPHA
            : DEFAULT_PILL_TINT_ALPHA
         : needsBoost
           ? 0.22
           : 0.12;

   return hexToRgba(displayColor, alpha);
}

/** Convert hex to rgba for light background tints */
export function hexToRgba(hex: string, alpha: number): string {
   const rgb = parseHexRgb(hex);
   if (!rgb) {
      return `rgba(111, 67, 27, ${alpha})`;
   }

   return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Minimum gradient alpha when mood hex is low-contrast in dark mode */
export function getMoodGradientAlpha(baseAlpha: number, isDark: boolean, hex: string): number {
   if (!isDark || !isLowContrastMoodColor(hex, true)) {
      return baseAlpha;
   }
   return Math.max(baseAlpha, 0.18);
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
