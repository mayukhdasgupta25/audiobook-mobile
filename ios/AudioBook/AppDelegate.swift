import Expo
import React
import ReactAppDependencyProvider
import MediaPlayer
import AVFoundation

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
    
    // Configure audio session for background playback
    setupAudioSession()
    
    // Setup remote command center for lock screen controls
    setupRemoteCommandCenter()
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  // Configure audio session for background playback
  private func setupAudioSession() {
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetooth])
      try audioSession.setActive(true)
    } catch {
      print("[AppDelegate] Failed to setup audio session: \(error)")
    }
  }
  
  // Setup remote command center for lock screen controls
  private func setupRemoteCommandCenter() {
    let commandCenter = MPRemoteCommandCenter.shared()
    
    // Enable play command
    commandCenter.playCommand.isEnabled = true
    commandCenter.playCommand.addTarget { [weak self] _ in
      // Send play event to React Native
      self?.sendRemoteCommandEvent("play")
      return .success
    }
    
    // Enable pause command
    commandCenter.pauseCommand.isEnabled = true
    commandCenter.pauseCommand.addTarget { [weak self] _ in
      // Send pause event to React Native
      self?.sendRemoteCommandEvent("pause")
      return .success
    }
    
    // Enable toggle play/pause command
    commandCenter.togglePlayPauseCommand.isEnabled = true
    commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
      // Send toggle event to React Native
      self?.sendRemoteCommandEvent("toggle")
      return .success
    }
    
    // Enable next track command (for chapter navigation)
    commandCenter.nextTrackCommand.isEnabled = true
    commandCenter.nextTrackCommand.addTarget { [weak self] _ in
      // Send next event to React Native
      self?.sendRemoteCommandEvent("next")
      return .success
    }
    
    // Enable previous track command (for chapter navigation)
    commandCenter.previousTrackCommand.isEnabled = true
    commandCenter.previousTrackCommand.addTarget { [weak self] _ in
      // Send previous event to React Native
      self?.sendRemoteCommandEvent("previous")
      return .success
    }
    
    // Enable seek forward command
    commandCenter.skipForwardCommand.preferredIntervals = [10]
    commandCenter.skipForwardCommand.isEnabled = true
    commandCenter.skipForwardCommand.addTarget { [weak self] _ in
      // Send seek forward event to React Native
      self?.sendRemoteCommandEvent("seekForward", value: 10)
      return .success
    }
    
    // Enable seek backward command
    commandCenter.skipBackwardCommand.preferredIntervals = [10]
    commandCenter.skipBackwardCommand.isEnabled = true
    commandCenter.skipBackwardCommand.addTarget { [weak self] _ in
      // Send seek backward event to React Native
      self?.sendRemoteCommandEvent("seekBackward", value: 10)
      return .success
    }
  }
  
  // Send remote command event to React Native bridge
  private func sendRemoteCommandEvent(_ command: String, value: Double? = nil) {
    // Note: react-native-video handles most remote control events automatically
    // This is a placeholder for custom handling if needed
    // The Video component's onPlay/onPause callbacks will be triggered
    print("[AppDelegate] Remote command: \(command), value: \(value ?? 0)")
    
    // For now, react-native-video will handle play/pause automatically
    // If custom handling is needed, create a native module to bridge events
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
