import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

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
      this.recording = null;
      return uri;
    } catch (err) {
      console.error('[VoiceRecorder] Failed to stop recording', err);
      return null;
    }
  }

  async getAudioBase64(uri: string): Promise<string | null> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return base64;
    } catch (err) {
      console.error('Failed to read audio as base64', err);
      return null;
    }
  }

  async cleanup(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (err) {
      console.error('Failed to cleanup audio file', err);
    }
  }
}

export const voiceRecorder = new VoiceRecorder();
