import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { Fonts, Radius, Shadow } from '@/constants/theme';
import { voiceRecorder } from '@/services/voiceRecorder';
import * as FileSystem from 'expo-file-system';

const WaveBar = ({ height, isRecording }: { height: Animated.Value; isRecording: boolean }) => {
  const animatedHeight = height.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { height: animatedHeight },
      ]}
    />
  );
};

export default function VoiceRecorderTest() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  const waveHeights = useRef(Array(5).fill(null).map(() => new Animated.Value(10))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
    console.log(`[VoiceTest] ${message}`);
  };

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      // Animate wave bars
      waveHeights.forEach((height, index) => {
        const animateBar = () => {
          if (!isRecording) return;
          Animated.sequence([
            Animated.timing(height, {
              toValue: Math.random() * 70 + 20,
              duration: 300 + Math.random() * 300,
              useNativeDriver: false,
            }),
            Animated.timing(height, {
              toValue: 10,
              duration: 300 + Math.random() * 300,
              useNativeDriver: false,
            }),
          ]).start(() => animateBar());
        };
        setTimeout(animateBar, index * 100);
      });

      // Duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      waveHeights.forEach(bar => bar.setValue(10));
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const checkPermissions = async () => {
    addLog('Checking microphone permissions...');
    try {
      const hasPermission = await voiceRecorder.requestPermissions();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      addLog(`Permission status: ${hasPermission ? 'GRANTED' : 'DENIED'}`);
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required to record audio. Please enable it in settings.',
          [{ text: 'OK' }]
        );
      }
      return hasPermission;
    } catch (error: any) {
      addLog(`Permission check error: ${error.message}`);
      return false;
    }
  };

  const startRecording = async () => {
    addLog('Starting recording...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check permissions first
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      addLog('Cannot start recording - permission denied');
      return;
    }

    setRecordingDuration(0);
    setAudioUri(null);
    setFileInfo(null);

    try {
      const success = await voiceRecorder.startRecording((duration) => {
        // Optional: handle duration updates
      });

      if (success) {
        setIsRecording(true);
        addLog('Recording started successfully');
      } else {
        addLog('Failed to start recording');
        Alert.alert('Error', 'Failed to start recording');
      }
    } catch (error: any) {
      addLog(`Start recording error: ${error.message}`);
      Alert.alert('Error', error.message || 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    addLog('Stopping recording...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);
    setIsProcessing(true);

    try {
      const uri = await voiceRecorder.stopRecording();
      
      if (uri) {
        addLog(`Recording stopped. URI: ${uri}`);
        setAudioUri(uri);

        // Get file info
        try {
          const info = await FileSystem.getInfoAsync(uri);
          setFileInfo(info);
          addLog(`File info: ${JSON.stringify(info, null, 2)}`);

          if (info.exists && 'size' in info) {
            const sizeKB = (info.size / 1024).toFixed(2);
            addLog(`Audio file size: ${sizeKB} KB`);
            
            if (info.size === 0) {
              addLog('WARNING: Audio file is empty!');
              Alert.alert('Warning', 'The recorded audio file appears to be empty.');
            }
          }
        } catch (e: any) {
          addLog(`File info error: ${e.message}`);
        }
      } else {
        addLog('No audio URI returned');
        Alert.alert('Error', 'No audio was recorded');
      }
    } catch (error: any) {
      addLog(`Stop recording error: ${error.message}`);
      Alert.alert('Error', error.message || 'Failed to stop recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanupAudio = async () => {
    if (audioUri) {
      addLog('Cleaning up audio file...');
      try {
        await voiceRecorder.cleanup(audioUri);
        addLog('Audio file deleted');
        setAudioUri(null);
        setFileInfo(null);
      } catch (error: any) {
        addLog(`Cleanup error: ${error.message}`);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Voice Recorder Test
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Permission: {permissionStatus}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Recording Visualizer */}
        <View style={[styles.visualizerCard, { backgroundColor: colors.card }]}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                backgroundColor: colors.intentError + '20',
                transform: [{ scale: pulseAnim }],
                opacity: isRecording ? 1 : 0,
              },
            ]}
          />
          
          <View style={styles.waveform}>
            {waveHeights.map((height, index) => (
              <WaveBar key={index} height={height} isRecording={isRecording} />
            ))}
          </View>

          <Text style={[styles.duration, { color: colors.foreground }]}>
            {formatDuration(recordingDuration)}
          </Text>

          <Text style={[styles.status, { color: colors.mutedForeground }]}>
            {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Ready'}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            style={[
              styles.recordButton,
              {
                backgroundColor: isRecording ? colors.intentError : colors.primary,
                opacity: isProcessing ? 0.6 : 1,
              },
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Feather name={isRecording ? 'square' : 'mic'} size={32} color="#fff" />
            )}
          </TouchableOpacity>

          <Text style={[styles.buttonLabel, { color: colors.mutedForeground }]}>
            {isRecording ? 'Tap to Stop' : 'Tap to Record'}
          </Text>
        </View>

        {/* Audio File Info */}
        {audioUri && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              Recording Result
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                File URI:
              </Text>
              <Text 
                style={[styles.infoValue, { color: colors.foreground }]} 
                numberOfLines={2}
              >
                {audioUri}
              </Text>
            </View>

            {fileInfo && (
              <>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Exists:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {fileInfo.exists ? 'Yes' : 'No'}
                  </Text>
                </View>

                {fileInfo.size !== undefined && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Size:
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      {(fileInfo.size / 1024).toFixed(2)} KB
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Duration:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {formatDuration(recordingDuration)}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={cleanupAudio}
              style={[styles.cleanupButton, { backgroundColor: colors.intentError + '20' }]}
            >
              <Feather name="trash-2" size={16} color={colors.intentError} />
              <Text style={[styles.cleanupText, { color: colors.intentError }]}>
                Delete Recording
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Test Logs */}
        <View style={[styles.logCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.logTitle, { color: colors.foreground }]}>
            Test Logs
          </Text>
          <ScrollView style={styles.logs}>
            {logs.map((log, index) => (
              <Text key={index} style={[styles.logEntry, { color: colors.mutedForeground }]}>
                {log}
              </Text>
            ))}
            {logs.length === 0 && (
              <Text style={[styles.emptyLog, { color: colors.mutedForeground }]}>
                No logs yet. Start recording to see logs...
              </Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  visualizerCard: {
    borderRadius: Radius.xl,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 80,
    width: '80%',
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#6C63FF',
  },
  duration: {
    fontFamily: Fonts.bold,
    fontSize: 36,
    marginTop: 20,
  },
  status: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginTop: 8,
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.default,
  },
  buttonLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginTop: 12,
  },
  infoCard: {
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    width: 80,
  },
  infoValue: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    flex: 1,
    flexWrap: 'wrap',
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginTop: 12,
  },
  cleanupText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  logCard: {
    borderRadius: Radius.xl,
    padding: 16,
    maxHeight: 300,
  },
  logTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginBottom: 12,
  },
  logs: {
    maxHeight: 240,
  },
  logEntry: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  emptyLog: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
