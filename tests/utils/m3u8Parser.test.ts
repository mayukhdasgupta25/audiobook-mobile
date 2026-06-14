import {
   getBitrateInKbps,
   selectStreamWithFallback,
   type StreamInfo,
} from '@/utils/m3u8Parser';

function makeStream(bandwidth: number, bitrateLabel: string): StreamInfo {
   return {
      bandwidth,
      playlistPath: `bit_transcode/chapter-1/${bitrateLabel}k/playlist.m3u8`,
   };
}

describe('selectStreamWithFallback', () => {
   const streams: StreamInfo[] = [
      makeStream(64000, '64'),
      makeStream(128000, '128'),
      makeStream(256000, '256'),
   ];

   it('selects the preferred bitrate when available', () => {
      const selected = selectStreamWithFallback(streams, 256);
      expect(getBitrateInKbps(selected.bandwidth)).toBe(256);
   });

   it('steps down when the preferred bitrate is missing', () => {
      const partialStreams = [makeStream(64000, '64'), makeStream(128000, '128')];
      const selected = selectStreamWithFallback(partialStreams, 256);
      expect(getBitrateInKbps(selected.bandwidth)).toBe(128);
   });

   it('falls back to the lowest available stream', () => {
      const lowOnly = [makeStream(64000, '64')];
      const selected = selectStreamWithFallback(lowOnly, 256);
      expect(getBitrateInKbps(selected.bandwidth)).toBe(64);
   });

   it('throws when no streams exist', () => {
      expect(() => selectStreamWithFallback([], 128)).toThrow(
         'No streams available in master playlist'
      );
   });
});
