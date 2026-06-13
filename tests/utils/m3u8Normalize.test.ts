jest.mock('@/services/api', () => ({
   STREAMING_API_BASE_URL: 'http://192.168.1.4:8082',
}));

import {
   normalizeM3u8Content,
   normalizeMediaUri,
   resolvePlaybackMediaUri,
} from '@/utils/m3u8Normalize';

describe('m3u8Normalize', () => {
   const context = { chapterId: 'chapter-1', bitrate: '128' };

   describe('normalizeMediaUri', () => {
      it('fixes backslashes in paths', () => {
         expect(normalizeMediaUri('bit_transcode\\chapter-1\\128k\\segment_000.m4s')).toBe(
            'bit_transcode/chapter-1/128k/segment_000.m4s'
         );
      });

      it('removes duplicated bit_transcode path segments', () => {
         const uri =
            'http://localhost:8082/bit_transcode/chapter-1/128k/bit_transcode/chapter-1/128k/segment_000.m4s';
         expect(normalizeMediaUri(uri)).toBe(
            'http://localhost:8082/bit_transcode/chapter-1/128k/segment_000.m4s'
         );
      });
   });

   describe('resolvePlaybackMediaUri', () => {
      it('rewrites absolute localhost URLs to the client streaming base', () => {
         expect(
            resolvePlaybackMediaUri(
               'http://localhost:8082/bit_transcode/chapter-1/128k/segment_000.m4s'
            )
         ).toBe('http://192.168.1.4:8082/bit_transcode/chapter-1/128k/segment_000.m4s');
      });

      it('resolves relative bit_transcode paths', () => {
         expect(
            resolvePlaybackMediaUri('bit_transcode/chapter-1/128k/init.mp4')
         ).toBe('http://192.168.1.4:8082/bit_transcode/chapter-1/128k/init.mp4');
      });

      it('resolves bare segment filenames with chapter context', () => {
         expect(resolvePlaybackMediaUri('segment_000.m4s', context)).toBe(
            'http://192.168.1.4:8082/bit_transcode/chapter-1/128k/segment_000.m4s'
         );
      });
   });

   describe('normalizeM3u8Content', () => {
      it('rewrites init map and segment lines in a variant playlist', () => {
         const input = [
            '#EXTM3U',
            '#EXT-X-VERSION:7',
            '#EXT-X-MAP:URI="http://localhost:8082/bit_transcode/chapter-1/128k/init.mp4"',
            '',
            '#EXTINF:4.0,',
            'http://localhost:8082/bit_transcode/chapter-1/128k/segment_000.m4s',
         ].join('\n');

         const output = normalizeM3u8Content(input, context);

         expect(output).toContain(
            '#EXT-X-MAP:URI="http://192.168.1.4:8082/bit_transcode/chapter-1/128k/init.mp4"'
         );
         expect(output).toContain(
            'http://192.168.1.4:8082/bit_transcode/chapter-1/128k/segment_000.m4s'
         );
      });
   });
});
