/**
 * Moods service
 * Handles mood API calls
 */

import { get, ApiError, API_V1_PATH } from './api';
import { normalizeHexCode } from '@/utils/moodAssets';

export interface Mood {
   id: string;
   name: string;
   hexCode: string;
}

export interface MoodAttribute {
   iconName: string;
   description: string;
}

export interface MoodDetail extends Mood {
   description: string;
   purpose: string;
   moodAttributes: MoodAttribute[];
}

interface MoodApiAttribute {
   iconName?: string;
   icon?: string;
   name?: string;
   description?: string;
}

interface MoodApiRecord {
   id: string;
   name: string;
   hexCode?: string;
   hexcode?: string;
   description?: string;
   purpose?: string;
   moodAttributes?: MoodApiAttribute[];
   attributes?: MoodApiAttribute[];
}

interface MoodsListResponse {
   success: boolean;
   data: MoodApiRecord[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

interface MoodDetailResponse {
   success: boolean;
   data: MoodApiRecord;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

function mapMood(record: MoodApiRecord): Mood {
   return {
      id: record.id,
      name: record.name,
      hexCode: normalizeHexCode(record.hexCode ?? record.hexcode ?? ''),
   };
}

function mapMoodAttribute(attribute: MoodApiAttribute): MoodAttribute | null {
   const iconName = attribute.iconName ?? attribute.icon ?? attribute.name;
   if (!iconName?.trim()) {
      return null;
   }

   return {
      iconName: iconName.trim(),
      description: attribute.description?.trim() ?? '',
   };
}

function mapMoodDetail(record: MoodApiRecord): MoodDetail {
   const attributes = record.moodAttributes ?? record.attributes ?? [];

   return {
      ...mapMood(record),
      description: record.description ?? '',
      purpose: record.purpose?.trim() ?? '',
      moodAttributes: attributes
         .map(mapMoodAttribute)
         .filter((attribute): attribute is MoodAttribute => attribute !== null),
   };
}

export async function getMoods(): Promise<Mood[]> {
   try {
      const response = await get<MoodsListResponse>(`${API_V1_PATH}/moods`, true);
      return (response.data.data ?? []).map(mapMood);
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch moods: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function getMoodById(id: string): Promise<MoodDetail> {
   try {
      const response = await get<MoodDetailResponse>(`${API_V1_PATH}/moods/${id}`, true);
      return mapMoodDetail(response.data.data);
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch mood: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
