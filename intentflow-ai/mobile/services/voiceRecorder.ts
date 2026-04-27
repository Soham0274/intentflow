import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface RecordingState {
  recording: Audio.Recording | null;
  isRecording: boolean;
  audioUri: string | null;
  duration: number;
}

export class VoiceRecorder {
  private recording: Audio.Recording | null = null;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return true; // Browser handles this during startAsync
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  async startRecording(onStatusUpdate?: (duration: number) => void): Promise<boolean> {
    try {
      console.log('[VoiceRecorder] Requesting permissions...');
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('[VoiceRecorder] Permission to record audio not granted');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[VoiceRecorder] Creating recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
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
        console.warn('[VoiceRecorder] No recording to stop');
        return null;
      }

      console.log('[VoiceRecorder] Stopping recording...');
      const status = await this.recording.getStatusAsync();
      if (!status.canRecord) {
        console.warn('[VoiceRecorder] Recording already stopped or unloaded');
      } else {
        await this.recording.stopAndUnloadAsync();
      }
      
      const uri = this.recording.getURI();
      console.log('[VoiceRecorder] Recording stopped, URI:', uri);
      
      if (uri && Platform.OS !== 'web') {
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            console.log(`[VoiceRecorder] Audio file info: ${fileInfo.size} bytes`);
            if (fileInfo.size === 0) {
              console.error('[VoiceRecorder] WARNING: Audio file is empty!');
            }
          }
        } catch (e) {
          console.error('[VoiceRecorder] Failed to get file info:', e);
        }
      }
      
      this.recording = null;
      return uri;
    } catch (err) {
      console.error('[VoiceRecorder] Failed to stop recording', err);
      this.recording = null;
      return null;
    }
  }

  async cleanup(uri: string): Promise<void> {
    if (Platform.OS === 'web' || !uri) return;
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log('[VoiceRecorder] Cleaned up audio file:', uri);
      }
    } catch (err) {
      console.log('[VoiceRecorder] Cleanup failed or file not found:', err);
    }
  }
}

export const voiceRecorder = new VoiceRecorder();
