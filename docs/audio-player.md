# Audio player (react-native-track-player)

Audiobook playback uses **react-native-track-player** (RNTP) v4.1.2 for HLS streaming, in-app controls, lock screen, and Android media notifications.

## Architecture

- **Playback:** Normalized local HLS playlist per chapter (see [Playback URL](#playback-url)).
- **UI state:** Redux [`store/player.ts`](../store/player.ts) drives [`AudioPlayer`](../components/AudioPlayer.tsx).
- **Playback logic:** [`contexts/AudioPlaybackContext.tsx`](../contexts/AudioPlaybackContext.tsx) keeps [`useAudioPlayer`](../hooks/useAudioPlayer.ts) mounted app-wide (even when the player sheet is closed).
- **Remote controls:** [`services/playbackServiceHandlers.ts`](../services/playbackServiceHandlers.ts) (main app); [`services/playbackService.ts`](../services/playbackService.ts) is the Android headless entry only.
- **Chapter cards:** [`hooks/useChaptersProgress.ts`](../hooks/useChaptersProgress.ts) + live `playbackPosition` on the details list.
- **Resume:** [`utils/openChapterForPlayback.ts`](../utils/openChapterForPlayback.ts) loads `GET /chapters/:id/progress` before every play.

```mermaid
flowchart LR
  UI[AudioPlayer_UI] --> Ctx[AudioPlaybackProvider]
  Ctx --> Hook[useAudioPlayer]
  Hook --> RNTP[TrackPlayer]
  Hook --> Redux[Redux_player]
  Remote[LockScreen_Notification] --> Service[playbackService]
  Service --> Redux
  Service --> RNTP
  Service --> Hook
```

## Chapter progress on cards

- **Live bar:** Active chapter while the player is visible or playing uses `playbackPosition` from Redux.
- **API bar:** Otherwise `GET /api/v1/chapters/:chapterId/progress` (see [`getChapterProgress`](../services/audiobooks.ts)).
- **Resume badge:** Shown when saved position is greater than 0 and the chapter is not actively playing.

## Supported controls

| Control | In-app | Lock screen / notification |
| ------- | ------ | -------------------------- |
| Play / Pause | Yes | Yes |
| Seek scrubber | Yes | Yes |
| Skip forward / back | Yes (configurable seconds) | Yes |
| Previous / next chapter | Yes | Yes |

Skip duration is configured under **Account → Playback** (5s, 10s, or 15s).

## Developer setup

### Requirements

- Expo **development build** (Expo Go is not supported)
- **New Architecture enabled** (`newArchEnabled: true` in `app.config.ts`, `android/gradle.properties`, `ios/Podfile.properties.json`) — required by Reanimated 4.x / Worklets

### Install and native rebuild

```bash
npm install
npx expo prebuild --clean
npx expo run:android
# or npx expo run:ios
```

### Entry point

[`index.js`](../index.js) registers the playback service before Expo Router:

```js
TrackPlayer.registerPlaybackService(() => require('./services/playbackService'));
import 'expo-router/entry';
```

### Playback URL

RNTP does **not** load the remote `playlist.m3u8` URL directly. The app fetches the playlist via the API, **fixes malformed segment URLs** (backslashes and duplicated `bit_transcode/.../128k/` paths from the server), writes a normalized file to the device cache, and plays that `file://` playlist. See [`utils/m3u8Normalize.ts`](../utils/m3u8Normalize.ts) and [`utils/chapterStreamUrl.ts`](../utils/chapterStreamUrl.ts).

`postinstall` runs **patch-package** on `react-native-track-player@4.1.2`:

1. **TurboModule (New Arch):** `@ReactMethod` methods must not use `= scope.launch { ... }` (returns `Job`). The patch converts them to block bodies so methods return `Unit`.
2. **Kotlin null-safety:** `Bundle?` handling for `getTrack` / `getQueue` / `getActiveTrack` on RN 0.81.

Patch: [`patches/react-native-track-player+4.1.2.patch`](../patches/react-native-track-player+4.1.2.patch). To regenerate after editing `node_modules`, run `node scripts/patch-rntp-music-module.js` then `npx patch-package react-native-track-player`.

### iOS background audio

`UIBackgroundModes: ['audio']` in [`app.config.ts`](../app.config.ts).

### Android media notification

- Manifest includes `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`, and `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.
- [`utils/ensureMediaNotificationPermission.ts`](../utils/ensureMediaNotificationPermission.ts) requests notification permission on API 33+ before `setupPlayer` and chapter load (required for the RNTP media notification and lock screen controls).

## Key files

| File | Role |
| ---- | ---- |
| `contexts/AudioPlaybackContext.tsx` | App-wide `useAudioPlayer` provider |
| `hooks/useAudioPlayer.ts` | Load chapter, seek, progress poll, chapter skip |
| `hooks/useChaptersProgress.ts` | Per-chapter progress for details list |
| `hooks/useTrackPlayerSetup.ts` | `setupPlayer`, notification capabilities |
| `services/playbackServiceHandlers.ts` | Lock screen / notification remote events (main JS) |
| `services/playbackService.ts` | RNTP headless task entry (Android) |
| `services/trackPlayerController.ts` | Bridge from service to hook |
| `utils/openChapterForPlayback.ts` | Fetch progress + `setChapter` + play |
| `utils/chapterNavigation.ts` | Next/prev chapter, auto-advance |
| `components/AudioPlayer.tsx` | In-app player UI only |
| `components/ChapterListItem.tsx` | Progress bar + Resume badge |

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| `TrackPlayerModule` / `TurboModuleInteropUtils$ParsingException` | Ensure `newArchEnabled: true` and the RNTP patch is applied (`npm install` runs `patch-package`). Rebuild the dev client. |
| `assertNewArchitectureEnabledTask` (Reanimated / Worklets) | Set `newArchEnabled: true`; do not disable New Arch for RNTP alone — use the TurboModule patch instead. |
| No audio | Check streaming URL and auth token; verify dev client includes RNTP |
| Skip interval wrong on lock screen | Change setting in Account → Playback; options refresh via `updateTrackPlayerOptions` |
| No notification / lock screen controls (Android) | On Android 13+, grant **Notifications** when prompted (`ensureMediaNotificationPermission`). If denied, enable in system Settings → Apps → AudioBook → Notifications, then restart playback. |
| Remote play/pause does nothing (New Arch) | RNTP 4.1.2 `MusicService.emit()` used legacy `currentReactContext` (null in bridgeless). Patched to `reactContext` in `patches/react-native-track-player+4.1.2.patch` — **rebuild the dev client** after `npm install`. |
| Notification tap relaunches / wrong screen | `app/+native-intent.tsx` rewrites `trackplayer://`; warm resume uses `playbackReturnPath` (no `router.push` stack reset). RNTP intent uses `REORDER_TO_FRONT` not `CLEAR_TOP`. |
| Audio continues after swiping app away | `appKilledPlaybackBehavior` is `StopPlaybackAndRemoveNotification` in `useTrackPlayerSetup`. Rebuild native app if behavior unchanged. |
| Android SDK not found | Add `android/local.properties` with `sdk.dir=...` |

## Testing checklist

1. Play a chapter — audio and notification metadata appear.
2. Lock device — play/pause, scrub, skip, next/prev work.
3. Change skip duration to 5s and 15s — in-app labels and remote skips update.
4. Let chapter end — auto-advance to next chapter when available.
5. Close player UI — audio can continue; lock screen controls still work.
6. Details screen — chapter cards show API progress; Resume badge when position > 0.
7. Reopen a chapter — playback resumes from `currentPosition` on the server.

## References

- [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player)
- [Getting started](https://rntp.dev/docs/basics/getting-started)
