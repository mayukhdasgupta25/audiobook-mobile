/**
 * App entry: register Track Player playback service before Expo Router boots.
 */
import TrackPlayer from 'react-native-track-player';

TrackPlayer.registerPlaybackService(() => require('./services/playbackService'));

import 'expo-router/entry';
