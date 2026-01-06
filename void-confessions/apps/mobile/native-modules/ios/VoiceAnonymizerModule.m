/**
 * VoiceAnonymizerModule.m
 * Implementation of iOS voice anonymization native module
 *
 * Processes audio files to anonymize voice by applying:
 * - Pitch shift (-6 to +6 semitones)
 * - Time stretch (0.9x to 1.1x)
 * - Background noise injection
 */

#import "VoiceAnonymizerModule.h"
#import <AVFoundation/AVFoundation.h>
#import <Accelerate/Accelerate.h>

@implementation VoiceAnonymizerModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

/**
 * Anonymize an audio file with pitch shift, time stretch, and noise injection
 *
 * @param inputUri - File URI of the original audio
 * @param pitchShift - Pitch shift in semitones (-6 to +6)
 * @param timeStretch - Time stretch factor (0.9 to 1.1)
 * @param noiseLevel - Noise level (0 to 0.2)
 */
RCT_EXPORT_METHOD(anonymizeAudio:(NSString *)inputUri
                  pitchShift:(double)pitchShift
                  timeStretch:(double)timeStretch
                  noiseLevel:(double)noiseLevel
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    @try {
      // Convert URI to file path
      NSURL *inputURL = [NSURL URLWithString:inputUri];
      if (!inputURL) {
        inputURL = [NSURL fileURLWithPath:inputUri];
      }

      // Create output file URL
      NSString *outputFileName = [NSString stringWithFormat:@"anonymized_%@.m4a",
                                  [[NSUUID UUID] UUIDString]];
      NSString *outputPath = [NSTemporaryDirectory() stringByAppendingPathComponent:outputFileName];
      NSURL *outputURL = [NSURL fileURLWithPath:outputPath];

      // Remove existing output file if any
      [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];

      // Setup audio engine
      AVAudioEngine *engine = [[AVAudioEngine alloc] init];
      AVAudioPlayerNode *playerNode = [[AVAudioPlayerNode alloc] init];
      AVAudioUnitTimePitch *timePitchNode = [[AVAudioUnitTimePitch alloc] init];

      // Configure pitch shift (semitones to cents)
      timePitchNode.pitch = pitchShift * 100.0; // Convert semitones to cents

      // Configure time stretch (rate)
      timePitchNode.rate = timeStretch;

      // Attach nodes
      [engine attachNode:playerNode];
      [engine attachNode:timePitchNode];

      // Load input file
      NSError *error = nil;
      AVAudioFile *inputFile = [[AVAudioFile alloc] initForReading:inputURL error:&error];
      if (error) {
        reject(@"FILE_ERROR", @"Failed to read input file", error);
        return;
      }

      AVAudioFormat *format = inputFile.processingFormat;
      AVAudioFrameCount frameCount = (AVAudioFrameCount)inputFile.length;

      // Connect nodes
      [engine connect:playerNode to:timePitchNode format:format];
      [engine connect:timePitchNode to:engine.mainMixerNode format:format];

      // Read audio data into buffer
      AVAudioPCMBuffer *inputBuffer = [[AVAudioPCMBuffer alloc] initWithPCMFormat:format
                                                                    frameCapacity:frameCount];
      [inputFile readIntoBuffer:inputBuffer error:&error];
      if (error) {
        reject(@"READ_ERROR", @"Failed to read audio data", error);
        return;
      }

      // Add noise to the buffer
      if (noiseLevel > 0) {
        [self addNoiseToBuffer:inputBuffer level:noiseLevel];
      }

      // Create output file
      AVAudioFile *outputFile = [[AVAudioFile alloc] initForWriting:outputURL
                                                           settings:@{
                                                             AVFormatIDKey: @(kAudioFormatMPEG4AAC),
                                                             AVSampleRateKey: @(format.sampleRate),
                                                             AVNumberOfChannelsKey: @(format.channelCount),
                                                             AVEncoderAudioQualityKey: @(AVAudioQualityHigh),
                                                             AVEncoderBitRateKey: @(128000)
                                                           }
                                                              error:&error];
      if (error) {
        reject(@"OUTPUT_ERROR", @"Failed to create output file", error);
        return;
      }

      // Install tap on main mixer to capture processed audio
      __block BOOL didFinish = NO;
      __block NSError *writeError = nil;

      [engine.mainMixerNode installTapOnBus:0
                                 bufferSize:4096
                                     format:format
                                      block:^(AVAudioPCMBuffer *buffer, AVAudioTime *when) {
        if (!didFinish) {
          NSError *err = nil;
          [outputFile writeFromBuffer:buffer error:&err];
          if (err) {
            writeError = err;
          }
        }
      }];

      // Start engine
      [engine prepare];
      [engine startAndReturnError:&error];
      if (error) {
        reject(@"ENGINE_ERROR", @"Failed to start audio engine", error);
        return;
      }

      // Schedule buffer and wait
      __block BOOL completed = NO;
      [playerNode scheduleBuffer:inputBuffer
                          atTime:nil
                         options:AVAudioPlayerNodeBufferInterrupts
               completionHandler:^{
        completed = YES;
      }];

      [playerNode play];

      // Wait for completion with timeout
      NSDate *timeout = [NSDate dateWithTimeIntervalSinceNow:120.0];
      while (!completed && [[NSDate date] compare:timeout] == NSOrderedAscending) {
        [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode
                                 beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
      }

      // Small delay to ensure all audio is written
      [NSThread sleepForTimeInterval:0.5];

      // Cleanup
      didFinish = YES;
      [playerNode stop];
      [engine.mainMixerNode removeTapOnBus:0];
      [engine stop];

      if (writeError) {
        reject(@"WRITE_ERROR", @"Failed to write processed audio", writeError);
        return;
      }

      // Verify output file exists
      if (![[NSFileManager defaultManager] fileExistsAtPath:outputPath]) {
        reject(@"OUTPUT_ERROR", @"Output file was not created", nil);
        return;
      }

      resolve(@{
        @"outputUri": outputURL.absoluteString,
        @"success": @(YES)
      });

    } @catch (NSException *exception) {
      reject(@"EXCEPTION", exception.reason, nil);
    }
  });
}

/**
 * Add random noise to audio buffer
 */
- (void)addNoiseToBuffer:(AVAudioPCMBuffer *)buffer level:(double)level
{
  float *channelData = buffer.floatChannelData[0];
  AVAudioFrameCount frameCount = buffer.frameLength;

  // Generate and add noise
  for (AVAudioFrameCount i = 0; i < frameCount; i++) {
    // Generate white noise
    float noise = ((float)arc4random() / UINT32_MAX) * 2.0 - 1.0;
    channelData[i] = channelData[i] + (noise * level);

    // Clamp to valid range
    channelData[i] = fmaxf(-1.0, fminf(1.0, channelData[i]));
  }

  // If stereo, process second channel
  if (buffer.format.channelCount > 1) {
    float *rightChannel = buffer.floatChannelData[1];
    for (AVAudioFrameCount i = 0; i < frameCount; i++) {
      float noise = ((float)arc4random() / UINT32_MAX) * 2.0 - 1.0;
      rightChannel[i] = rightChannel[i] + (noise * level);
      rightChannel[i] = fmaxf(-1.0, fminf(1.0, rightChannel[i]));
    }
  }
}

/**
 * Check if voice anonymization is available
 */
RCT_EXPORT_METHOD(isAvailable:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@(YES));
}

@end
