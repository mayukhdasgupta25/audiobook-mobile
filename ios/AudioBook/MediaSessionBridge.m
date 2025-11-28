#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface RCT_EXTERN_MODULE(MediaSessionBridge, NSObject)

RCT_EXTERN_METHOD(updateNowPlaying:(NSDictionary *)info)

@end

