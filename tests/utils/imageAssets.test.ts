import {
   pickImageAssetPath,
   resolveAudiobookImageUrl,
   resolveImageAssetUrl,
   resolveOrganizationImageUrl,
   toAbsoluteImageUrl,
   toDisplayImageUri,
} from '@/utils/imageAssets';

jest.mock('@/services/api', () => ({
   getMainApiUrl: () => 'http://app.test',
   AUTH_API_BASE_URL: 'http://auth.test',
}));

describe('imageAssets resolver', () => {
   const imageAssets = {
      portrait_7_10: '/uploads/images/audiobook/abc/portrait_7_10.jpg',
      square_56: '/uploads/images/audiobook/abc/square_56.jpg',
   };

   it('picks the correct variant from imageAssets', () => {
      const url = resolveImageAssetUrl(
         '/uploads/images/audiobook/abc/original.jpg',
         imageAssets,
         'portrait_7_10'
      );
      expect(url).toBe('http://app.test/uploads/images/audiobook/abc/portrait_7_10.jpg');
   });

   it('falls back to legacy fields then primary path', () => {
      expect(
         pickImageAssetPath('/primary.jpg', undefined, 'portrait_7_10', [
            '/legacy-card.jpg',
         ])
      ).toBe('/legacy-card.jpg');

      expect(
         pickImageAssetPath('/primary.jpg', undefined, 'portrait_7_10')
      ).toBe('/primary.jpg');
   });

   it('handles absolute URLs without double-prefixing', () => {
      const absolute = 'https://cdn.example.com/cover.jpg';
      expect(toAbsoluteImageUrl(absolute)).toBe(absolute);
      expect(toDisplayImageUri(absolute)).toBe(absolute);
      expect(
         resolveImageAssetUrl(null, { portrait_7_10: absolute }, 'portrait_7_10')
      ).toBe(absolute);
   });

   it('builds relative paths with the main API base', () => {
      expect(toAbsoluteImageUrl('uploads/cover.jpg')).toBe(
         'http://app.test/uploads/cover.jpg'
      );
      expect(toAbsoluteImageUrl('/uploads/cover.jpg')).toBe(
         'http://app.test/uploads/cover.jpg'
      );
   });

   it('uses auth API base for organization images', () => {
      const url = resolveOrganizationImageUrl(
         {
            image: '/uploads/org/logo.jpg',
            imageAssets: { square_512: '/uploads/org/square_512.jpg' },
         },
         'logo'
      );
      expect(url).toBe('http://auth.test/uploads/org/square_512.jpg');
   });

   it('returns undefined when no image is available', () => {
      expect(resolveImageAssetUrl(null, undefined, 'portrait_7_10')).toBeUndefined();
      expect(
         resolveAudiobookImageUrl(
            {
               coverImage: '',
               imageAssets: undefined,
               contentCardCoverImage: null,
               chaptersHeroCoverImage: null,
               homeHeroCoverImage: null,
            },
            'gridCard'
         )
      ).toBeUndefined();
   });

   it('resolves audiobook slot variants with legacy fallbacks', () => {
      const url = resolveAudiobookImageUrl(
         {
            coverImage: '/uploads/original.jpg',
            imageAssets,
            contentCardCoverImage: '/uploads/card.jpg',
            chaptersHeroCoverImage: null,
            homeHeroCoverImage: null,
         },
         'listRow'
      );
      expect(url).toBe('http://app.test/uploads/images/audiobook/abc/square_56.jpg');
   });
});
