/**
 * RNTP headless task entry (Android). Must use `module.exports` only — no named exports.
 */

import { setupPlaybackServiceHandlers } from '@/services/playbackServiceHandlers';

module.exports = async function playbackService(): Promise<void> {
   setupPlaybackServiceHandlers();
};
