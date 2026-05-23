/**
 * Patches react-native-track-player MusicModule.kt for:
 * 1. TurboModule (New Arch): @ReactMethod must not return Job from `= scope.launch`
 * 2. Kotlin null-safety for Bundle? on RN 0.81
 */
const fs = require('fs');
const path = require('path');

const modulePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-track-player',
  'android',
  'src',
  'main',
  'java',
  'com',
  'doublesymmetry',
  'trackplayer',
  'module',
  'MusicModule.kt'
);

let lines = fs.readFileSync(modulePath, 'utf8').split('\n');

// Convert `fun foo(...) = scope.launch {` (same line) to block body
for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(/^(\s*fun .+\)) = scope\.launch \{$/);
  if (match) {
    lines[i] = `${match[1]} {`;
    lines.splice(i + 1, 0, '        scope.launch {');
    i += 1;
  }
}

// Convert `fun foo(...)\n        = scope.launch {` (next line) to block body
for (let i = 0; i < lines.length - 1; i++) {
  const match = lines[i].match(/^(\s*fun .+\))\s*=\s*$/);
  if (match && lines[i + 1].trim() === 'scope.launch {') {
    lines[i] = `${match[1]} {`;
    lines[i + 1] = '        scope.launch {';
  }
}

// Insert closing brace for outer function before next @ReactMethod or class end
const methodStarts = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('@ReactMethod')) {
    methodStarts.push(i);
  }
}
methodStarts.push(lines.length);

let offset = 0;
for (let m = 0; m < methodStarts.length - 1; m++) {
  const start = methodStarts[m] + offset;
  const end = methodStarts[m + 1] + offset;
  const slice = lines.slice(start, end);
  const usesScopeLaunch = slice.some((l) => l.trim() === 'scope.launch {');
  if (!usesScopeLaunch) continue;

  let insertAt = end - 1;
  while (insertAt > start && lines[insertAt].trim() === '') {
    insertAt -= 1;
  }
  if (lines[insertAt] === '    }') {
    lines.splice(insertAt + 1, 0, '    }');
    offset += 1;
  }
}

// Last method may end at class closing brace instead of next @ReactMethod
const classCloseIdx = lines.lastIndexOf('}');
if (classCloseIdx > 0 && lines[classCloseIdx - 1] === '    }') {
  const beforeClass = lines.slice(0, classCloseIdx);
  const lastMethodStart = beforeClass.map((l) => l.trim().startsWith('@ReactMethod')).lastIndexOf(true);
  if (lastMethodStart >= 0) {
    const slice = beforeClass.slice(lastMethodStart);
    if (slice.some((l) => l.trim() === 'scope.launch {')) {
      const prevLine = lines[classCloseIdx - 1];
      const prevPrev = lines[classCloseIdx - 2];
      if (prevLine === '    }' && prevPrev !== '    }') {
        lines.splice(classCloseIdx, 0, '    }');
      }
    }
  }
}

let content = lines.join('\n');

content = content.replace(
  'callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem))',
  'callback.resolve(musicService.tracks[index].originalItem?.let { Arguments.fromBundle(it) })'
);
content = content.replace(
  'callback.resolve(Arguments.fromList(musicService.tracks.map { it.originalItem }))',
  `callback.resolve(
            Arguments.fromList(
                musicService.tracks.mapNotNull { it.originalItem?.let { bundle -> Arguments.fromBundle(bundle) } }
            )
        )`
);
content = content.replace(
  /else Arguments\.fromBundle\(\s*musicService\.tracks\[musicService\.getCurrentTrackIndex\(\)\]\.originalItem\s*\)/,
  'else musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let {\n                Arguments.fromBundle(it)\n            }'
);

fs.writeFileSync(modulePath, content);
console.log('Patched', modulePath);
