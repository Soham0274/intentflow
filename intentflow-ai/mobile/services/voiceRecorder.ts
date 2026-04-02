import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export interface RecordingState {
  recording: Audio.Recording | null;
  isRecording: boolean;
  audioUri: string | null;
  duration: number;
}

export class VoiceRecorder {
  private recording: Audio.Recording | null = null;
  private onRecordingStatusUpdate: ((status: { durationMillis: number }) => void) | null = null;

  async requestPermissions(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  async startRecording(onStatusUpdate?: (duration: number) => void): Promise<boolean> {
    try {
      console.log('[VoiceRecorder] Requesting permissions...');
      const hasPermission = await this.requestPermissions();
      console.log('[VoiceRecorder] Permission status:', hasPermission);
      if (!hasPermission) {
        console.error('[VoiceRecorder] Permission to record audio not granted');
        return false;
      }

      console.log('[VoiceRecorder] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[VoiceRecorder] Creating recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          console.log('[VoiceRecorder] Status update - duration:', status.durationMillis, 'isRecording:', status.isRecording);
          if (onStatusUpdate && status.durationMillis) {
            onStatusUpdate(status.durationMillis);
          }
        }
      );

      this.recording = recording;
      console.log('[VoiceRecorder] Recording created successfully');
      return true;
    } catch (err) {
      console.error('[VoiceRecorder] Failed to start recording', err);
      return false;
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        console.error('[VoiceRecorder] No recording to stop');
        return null;
      }

      console.log('[VoiceRecorder] Stopping recording...');
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      console.log('[VoiceRecorder] Recording stopped, URI:', uri);
      
      // Check file exists and get info using new File API (SDK 54+)
      // Skip on web - expo-file-system is not supported on web platform
      if (uri && Platform.OS !== 'web') {
        try {
          const file = new File(uri);
          // Access properties directly, no need for getInfoAsync
          if (file.exists) {
            console.log('[VoiceRecorder] Audio file info:');
            console.log('[VoiceRecorder] - exists:', file.exists);
            console.log('[VoiceRecorder] - size:', file.size, 'bytes');
            console.log('[VoiceRecorder] - type:', file.type);
            if (file.size === 0) {
              console.error('[VoiceRecorder] WARNING: Audio file is empty!');
            }
          } else {
            console.log('[VoiceRecorder] File does not exist yet');
          }
        } catch (e) {
          console.error('[VoiceRecorder] Failed to get file info:', e);
          // Non-fatal: file info is just for logging
        }
      } else if (uri && Platform.OS === 'web') {
        console.log('[VoiceRecorder] Running on web - skipping file info check');
      }
      
      this.recording = null;
      return uri;
    } catch (err) {
      console.error('[VoiceRecorder] Failed to stop recording', err);
      return null;
    }
  }

  async getAudioBase64(uri: string): Promise<string | null> {
    // Not supported on web - blob URLs can't be read with expo-file-system
    if (Platform.OS === 'web') {
      console.log('[VoiceRecorder] getAudioBase64 not supported on web');
      return null;
    }
    try {
      const file = new File(uri);
      const base64 = await file.base64();
      return base64;
    } catch (err) {
      console.error('Failed to read audio as base64', err);
      return null;
    }
  }

  async cleanup(uri: string): Promise<void> {
    // Skip cleanup on web - expo-file-system not supported
    if (Platform.OS === 'web') {
      console.log('[VoiceRecorder] Cleanup skipped on web');
      return;
    }
    try {
      const file = new File(uri);
      // Check if file exists before trying to delete
      if (file.exists) {
        await file.delete();
        console.log('[VoiceRecorder] Cleaned up audio file:', uri);
      }
    } catch (err) {
      // File might not exist, which is fine
      console.log('[VoiceRecorder] Cleanup: file already deleted or not found');
    }
  }
}

export const voiceRecorder = new VoiceRecorder();
