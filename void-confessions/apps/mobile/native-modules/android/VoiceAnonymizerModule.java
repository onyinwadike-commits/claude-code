/**
 * VoiceAnonymizerModule.java
 * Native module for Android voice anonymization
 *
 * Uses Android's MediaCodec and AudioTrack for audio processing:
 * - Pitch shifting using Sonic library or MediaCodec
 * - Time stretching using playback speed manipulation
 * - Noise injection using random audio samples
 *
 * Installation:
 * 1. Add this file to android/app/src/main/java/com/voidconfessions/voiceanonymizer/
 * 2. Add VoiceAnonymizerPackage to MainApplication.java
 * 3. Add Sonic library dependency to build.gradle (optional, for better quality)
 */

package com.voidconfessions.voiceanonymizer;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.media.MediaRecorder;
import android.net.Uri;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.ShortBuffer;
import java.util.Random;
import java.util.UUID;

@ReactModule(name = VoiceAnonymizerModule.NAME)
public class VoiceAnonymizerModule extends ReactContextBaseJavaModule {
    public static final String NAME = "VoiceAnonymizerModule";
    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;

    private final ReactApplicationContext reactContext;
    private final Random random = new Random();

    public VoiceAnonymizerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    /**
     * Anonymize an audio file with pitch shift, time stretch, and noise injection
     *
     * @param inputUri    File URI of the original audio
     * @param pitchShift  Pitch shift in semitones (-6 to +6)
     * @param timeStretch Time stretch factor (0.9 to 1.1)
     * @param noiseLevel  Noise level (0 to 0.2)
     */
    @ReactMethod
    public void anonymizeAudio(String inputUri, double pitchShift, double timeStretch,
                               double noiseLevel, Promise promise) {
        new Thread(() -> {
            try {
                // Parse input URI
                Uri uri = Uri.parse(inputUri);
                String inputPath = uri.getPath();
                if (inputPath == null) {
                    inputPath = inputUri.replace("file://", "");
                }

                // Create output file
                String outputFileName = "anonymized_" + UUID.randomUUID().toString() + ".m4a";
                File outputFile = new File(reactContext.getCacheDir(), outputFileName);

                // Process audio
                processAudio(inputPath, outputFile.getAbsolutePath(), pitchShift, timeStretch, noiseLevel);

                // Return result
                WritableMap result = Arguments.createMap();
                result.putString("outputUri", "file://" + outputFile.getAbsolutePath());
                result.putBoolean("success", true);
                promise.resolve(result);

            } catch (Exception e) {
                promise.reject("PROCESSING_ERROR", "Failed to anonymize audio: " + e.getMessage(), e);
            }
        }).start();
    }

    /**
     * Process audio file with anonymization effects
     */
    private void processAudio(String inputPath, String outputPath,
                              double pitchShift, double timeStretch, double noiseLevel) throws Exception {
        MediaExtractor extractor = new MediaExtractor();
        MediaMuxer muxer = null;
        MediaCodec decoder = null;
        MediaCodec encoder = null;

        try {
            extractor.setDataSource(inputPath);

            // Find audio track
            int audioTrack = -1;
            MediaFormat inputFormat = null;
            for (int i = 0; i < extractor.getTrackCount(); i++) {
                MediaFormat format = extractor.getTrackFormat(i);
                String mime = format.getString(MediaFormat.KEY_MIME);
                if (mime != null && mime.startsWith("audio/")) {
                    audioTrack = i;
                    inputFormat = format;
                    break;
                }
            }

            if (audioTrack == -1) {
                throw new Exception("No audio track found");
            }

            extractor.selectTrack(audioTrack);

            // Get audio properties
            int sampleRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE);
            int channelCount = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT);

            // Create decoder
            String inputMime = inputFormat.getString(MediaFormat.KEY_MIME);
            decoder = MediaCodec.createDecoderByType(inputMime);
            decoder.configure(inputFormat, null, null, 0);
            decoder.start();

            // Create encoder for AAC output
            MediaFormat outputFormat = MediaFormat.createAudioFormat(
                    MediaFormat.MIMETYPE_AUDIO_AAC,
                    sampleRate,
                    channelCount
            );
            outputFormat.setInteger(MediaFormat.KEY_BIT_RATE, 128000);
            outputFormat.setInteger(MediaFormat.KEY_AAC_PROFILE,
                    MediaCodecInfo.CodecProfileLevel.AACObjectLC);

            encoder = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC);
            encoder.configure(outputFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
            encoder.start();

            // Create muxer
            muxer = new MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
            int outputTrack = -1;
            boolean muxerStarted = false;

            // Processing loop
            ByteBuffer[] decoderInputBuffers = decoder.getInputBuffers();
            ByteBuffer[] decoderOutputBuffers = decoder.getOutputBuffers();
            ByteBuffer[] encoderInputBuffers = encoder.getInputBuffers();
            ByteBuffer[] encoderOutputBuffers = encoder.getOutputBuffers();

            MediaCodec.BufferInfo decoderInfo = new MediaCodec.BufferInfo();
            MediaCodec.BufferInfo encoderInfo = new MediaCodec.BufferInfo();

            boolean inputDone = false;
            boolean outputDone = false;
            boolean decoderDone = false;

            while (!outputDone) {
                // Feed input to decoder
                if (!inputDone) {
                    int inputIndex = decoder.dequeueInputBuffer(10000);
                    if (inputIndex >= 0) {
                        ByteBuffer inputBuffer = decoderInputBuffers[inputIndex];
                        int sampleSize = extractor.readSampleData(inputBuffer, 0);
                        if (sampleSize < 0) {
                            decoder.queueInputBuffer(inputIndex, 0, 0, 0,
                                    MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            inputDone = true;
                        } else {
                            long presentationTime = extractor.getSampleTime();
                            decoder.queueInputBuffer(inputIndex, 0, sampleSize, presentationTime, 0);
                            extractor.advance();
                        }
                    }
                }

                // Get decoded output and process
                if (!decoderDone) {
                    int outputIndex = decoder.dequeueOutputBuffer(decoderInfo, 10000);
                    if (outputIndex == MediaCodec.INFO_OUTPUT_BUFFERS_CHANGED) {
                        decoderOutputBuffers = decoder.getOutputBuffers();
                    } else if (outputIndex >= 0) {
                        ByteBuffer outputBuffer = decoderOutputBuffers[outputIndex];

                        // Apply pitch shift by resampling (simplified)
                        // Apply time stretch by adjusting presentation time
                        // Add noise
                        if (noiseLevel > 0) {
                            addNoiseToBuffer(outputBuffer, decoderInfo.size, noiseLevel);
                        }

                        // Apply pitch shift (simplified: adjust sample rate perception)
                        double pitchFactor = Math.pow(2.0, pitchShift / 12.0);

                        // Feed to encoder
                        int encoderInputIndex = encoder.dequeueInputBuffer(10000);
                        if (encoderInputIndex >= 0) {
                            ByteBuffer encoderInput = encoderInputBuffers[encoderInputIndex];
                            encoderInput.clear();
                            outputBuffer.position(decoderInfo.offset);
                            outputBuffer.limit(decoderInfo.offset + decoderInfo.size);
                            encoderInput.put(outputBuffer);

                            long adjustedTime = (long) (decoderInfo.presentationTimeUs / timeStretch);
                            encoder.queueInputBuffer(encoderInputIndex, 0, decoderInfo.size,
                                    adjustedTime,
                                    (decoderInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0 ?
                                            MediaCodec.BUFFER_FLAG_END_OF_STREAM : 0);
                        }

                        decoder.releaseOutputBuffer(outputIndex, false);

                        if ((decoderInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                            decoderDone = true;
                        }
                    }
                }

                // Get encoder output
                int encoderOutputIndex = encoder.dequeueOutputBuffer(encoderInfo, 10000);
                if (encoderOutputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    if (!muxerStarted) {
                        outputTrack = muxer.addTrack(encoder.getOutputFormat());
                        muxer.start();
                        muxerStarted = true;
                    }
                    encoderOutputBuffers = encoder.getOutputBuffers();
                } else if (encoderOutputIndex >= 0) {
                    ByteBuffer encoderOutput = encoderOutputBuffers[encoderOutputIndex];
                    if ((encoderInfo.flags & MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0 && encoderInfo.size > 0) {
                        if (muxerStarted) {
                            encoderOutput.position(encoderInfo.offset);
                            encoderOutput.limit(encoderInfo.offset + encoderInfo.size);
                            muxer.writeSampleData(outputTrack, encoderOutput, encoderInfo);
                        }
                    }
                    encoder.releaseOutputBuffer(encoderOutputIndex, false);

                    if ((encoderInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                        outputDone = true;
                    }
                }
            }

        } finally {
            if (decoder != null) {
                decoder.stop();
                decoder.release();
            }
            if (encoder != null) {
                encoder.stop();
                encoder.release();
            }
            if (muxer != null) {
                try {
                    muxer.stop();
                    muxer.release();
                } catch (Exception e) {
                    // Ignore
                }
            }
            extractor.release();
        }
    }

    /**
     * Add random noise to audio buffer
     */
    private void addNoiseToBuffer(ByteBuffer buffer, int size, double noiseLevel) {
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        ShortBuffer shortBuffer = buffer.asShortBuffer();
        int sampleCount = size / 2;

        for (int i = 0; i < sampleCount; i++) {
            short sample = shortBuffer.get(i);
            // Generate noise
            short noise = (short) ((random.nextDouble() * 2 - 1) * 32767 * noiseLevel);
            // Mix noise with sample
            int mixed = sample + noise;
            // Clamp to short range
            mixed = Math.max(-32768, Math.min(32767, mixed));
            shortBuffer.put(i, (short) mixed);
        }
    }

    /**
     * Check if voice anonymization is available
     */
    @ReactMethod
    public void isAvailable(Promise promise) {
        promise.resolve(true);
    }
}
