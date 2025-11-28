import ExpoModulesCore
import MediaPlayer
import UIKit

public class MediaSessionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MediaSession")
    
    Function("updateNowPlaying") { (info: [String: Any]) -> Void in
      var nowPlayingInfo = [String: Any]()
      
      // Set title
      if let title = info["title"] as? String {
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
      }
      
      // Set artist
      if let artist = info["artist"] as? String {
        nowPlayingInfo[MPMediaItemPropertyArtist] = artist
      }
      
      // Set duration
      if let duration = info["duration"] as? Double {
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
      }
      
      // Set elapsed time
      if let elapsedTime = info["elapsedTime"] as? Double {
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = elapsedTime
      }
      
      // Set playback rate
      if let isPlaying = info["isPlaying"] as? Bool {
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
      }
      
      // Set artwork if provided
      if let artworkUrl = info["artwork"] as? String, let url = URL(string: artworkUrl) {
        // Load image asynchronously
        URLSession.shared.dataTask(with: url) { data, _, _ in
          if let data = data, let image = UIImage(data: data) {
            let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
            nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
          } else {
            // Set info without artwork if image fails to load
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
          }
        }.resume()
      } else {
        // Set info without artwork
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
      }
    }
  }
}

