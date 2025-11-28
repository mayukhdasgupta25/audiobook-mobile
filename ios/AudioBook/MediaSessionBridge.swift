import Foundation
import React
import MediaPlayer
import UIKit

@objc(MediaSessionBridge)
class MediaSessionBridge: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func updateNowPlaying(_ info: [String: Any], resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
        rejecter("ERROR", "AppDelegate not found", nil)
        return
      }
      
      appDelegate.updateNowPlayingInfo(info)
      resolver(nil)
    }
  }
}

