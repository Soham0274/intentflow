import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fonts, Radius, Shadow } from '@/constants/theme';
import { processVoice } from '../services/api';
import { voiceRecorder } from '../services/voiceRecorder';

const WaveBar = ({ height }: { height: Animated.Value }) => (
  <Animated.View style={[styles.waveBar, { height, backgroundColor: '#6C63FF' }]} />
);

export default function VoiceScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [parsedIntent, setParsedIntent] = useState<any>(null);
  const [transcriptionConfidence, setTranscriptionConfidence] = useState(0);
  const [intentConfidence, setIntentConfidence] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bars = useRef([new Animated.Value(20), new Animated.Value(40), new Animated.Value(60), new Animated.Value(30), new Animated.Value(50)]).current;
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      bars.forEach(bar => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: Math.random() * 80 + 20, duration: 400 + Math.random() * 400, useNativeDriver: false }),
            Animated.timing(bar, { toValue: 20, duration: 400 + Math.random() * 400, useNativeDriver: false }),
          ])
        ).start();
      });

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      bars.forEach(bar => bar.setValue(20));
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

  const startRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecordingDuration(0);
    setTranscript('');
    setParsedIntent(null);
    
    const success = await voiceRecorder.startRecording();
    if (success) {
      setIsRecording(true);
    } else {
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);
    
    const uri = await voiceRecorder.stopRecording();
    if (uri) {
      setAudioUri(uri);
      setIsProcessing(true);
      
      try {
        // Send audio to backend for transcription
        const response = await processVoice(uri);
        
        if (response.success) {
          // Extract transcript from response
          const extractedText = response.transcript || response.text || '';
          setTranscript(extractedText);
          
          // Set confidence scores
          setTranscriptionConfidence(response.transcriptionConfidence || 95);
          setIntentConfidence(response.intentConfidence || 90);
          
          // Store parsed intent
          if (response.tasks && response.tasks.length > 0) {
            setParsedIntent(response.tasks[0]);
          }
          
          // Navigate to confirmation after a delay
          setTimeout(() => {
            router.push('/confirm');
          }, 2000);
        } else {
          Alert.alert('Error', response.message || 'Failed to process voice input');
        }
      } catch (error: any) {
        console.error('Voice processing error:', error);
        Alert.alert('Error', error.message || 'Failed to process voice input');
      } finally {
        setIsProcessing(false);
        // Cleanup audio file
        if (uri) {
          voiceRecorder.cleanup(uri);
        }
      }
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecording();
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    setTranscript(textInput);
    
    try {
      // Navigate to confirmation with text input
      router.push({
        pathname: '/confirm',
        params: { text: textInput }
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process text input');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Feather name="x" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <StatusPill variant={isRecording ? "listening" : "online"} 
          label={isRecording ? "LISTENING" : isProcessing ? "PROCESSING" : "READY"} />
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.transcriptContainer}>
          {isRecording && !transcript && (
            <Text style={styles.listeningText}>
              Listening{Array(recordingDuration % 4).fill('.').join('')}
            </Text>
          )}
          <Text style={styles.transcriptText}>
            {transcript || (isRecording ? '' : 'Tap the microphone to start recording...')}
            {isRecording && !transcript && (
              <Text style={{ color: '#4A5070' }}> Listening to your voice...</Text>
            )}
          </Text>
        </View>

        {isProcessing && (
          <View style={styles.parsingPanel}>
             <Feather name="loader" size={16} color="#6C63FF" />
             <Text style={styles.parsingText}>PARSING INTENT...</Text>
             <View style={styles.dottedLoader}>
                <View style={[styles.dot, { backgroundColor: '#6C63FF' }]} />
                <View style={[styles.dot, { backgroundColor: '#6C63FF', opacity: 0.6 }]} />
                <View style={[styles.dot, { backgroundColor: '#6C63FF', opacity: 0.3 }]} />
             </View>
          </View>
        )}

        {transcript && !isProcessing && (
          <View style={styles.confidenceRow}>
             <View style={[styles.confBadge, { backgroundColor: 'rgba(0, 200, 150, 0.1)' }]}>
                <Text style={{ color: '#00C896', fontFamily: Fonts.bold, fontSize: 10 }}>
                  {transcriptionConfidence}% TRANSCRIPTION
                </Text>
             </View>
             {parsedIntent && (
               <View style={[styles.confBadge, { backgroundColor: 'rgba(0, 200, 150, 0.1)' }]}>
                  <Text style={{ color: '#00C896', fontFamily: Fonts.bold, fontSize: 10 }}>
                    {intentConfidence}% INTENT
                  </Text>
               </View>
             )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
         {isRecording && (
           <View style={styles.recordingInfo}>
             <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
             <View style={styles.recordingIndicator}>
               <View style={styles.recordingDot} />
               <Text style={styles.recordingLabel}>Recording</Text>
             </View>
           </View>
         )}
         
         <View style={styles.waveContainer}>
            {bars.map((bar, i) => <WaveBar key={i} height={bar} />)}
         </View>

         {isTextMode ? (
           <View style={styles.textInputWrapper}>
              <TextInput 
                placeholder="Type your command..."
                placeholderTextColor="#5A6280"
                style={styles.textInput}
                autoFocus
                value={textInput}
                onChangeText={setTextInput}
                onSubmitEditing={handleTextSubmit}
                returnKeyType="send"
              />
              <TouchableOpacity 
                style={[styles.sendIcon, !textInput.trim() && { opacity: 0.5 }]} 
                onPress={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
              >
                 <Feather name="arrow-up" size={18} color="#FFFFFF" />
              </TouchableOpacity>
           </View>
         ) : (
           <View style={styles.controlsRow}>
              <TouchableOpacity 
                onPress={() => setIsTextMode(true)} 
                style={styles.toggleBtn}
                disabled={isProcessing}
              >
                 <MaterialCommunityIcons name="keyboard-outline" size={24} color="#5A6280" />
              </TouchableOpacity>

              <View style={styles.micOuter}>
                 <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.4 : 0 }]} />
                 <TouchableOpacity 
                   onPress={toggleRecording} 
                   activeOpacity={0.8}
                   disabled={isProcessing}
                   style={[styles.micBtn, { 
                     backgroundColor: isRecording ? '#FF4D4D' : '#6C63FF',
                     opacity: isProcessing ? 0.5 : 1 
                   }]}
                 >
                    {isProcessing ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <MaterialCommunityIcons 
                        name={isRecording ? "stop" : "microphone"} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    )}
                 </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.toggleBtn, isProcessing && { opacity: 0.5 }]} 
                onPress={() => router.push('/hitl')}
                disabled={isProcessing}
              >
                 <Feather name="shield" size={24} color="#5A6280" />
              </TouchableOpacity>
           </View>
         )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A10' },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(108, 99, 255, 0.08)', filter: 'blur(60px)' },
  orb1: { top: -100, right: -50 },
  orb2: { bottom: 100, left: -100, backgroundColor: 'rgba(42, 60, 255, 0.06)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1E2130', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 32, paddingTop: 60, paddingBottom: 20 },
  transcriptContainer: { marginBottom: 32 },
  transcriptText: { fontFamily: Fonts.displayBold, fontSize: 32, color: '#FFFFFF', letterSpacing: -1, lineHeight: 40 },
  listeningText: { fontFamily: Fonts.medium, fontSize: 16, color: '#6C63FF', marginBottom: 12 },
  parsingPanel: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(18, 20, 28, 0.85)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, width: 220, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignSelf: 'center' },
  parsingText: { color: '#6C63FF', fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 1.5, marginLeft: 12, marginRight: 8 },
  dottedLoader: { flexDirection: 'row', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  confidenceRow: { flexDirection: 'row', gap: 12, marginTop: 40, alignSelf: 'center' },
  confBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recordingInfo: { alignItems: 'center', marginBottom: 20 },
  recordingTime: { fontFamily: Fonts.displayBold, fontSize: 24, color: '#FF4D4D' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4D4D' },
  recordingLabel: { fontFamily: Fonts.medium, fontSize: 12, color: '#FF4D4D' },
  footer: { paddingBottom: 60, paddingHorizontal: 24, alignItems: 'center' },
  waveContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 40 },
  waveBar: { width: 4, borderRadius: 2 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20 },
  toggleBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  micOuter: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#6C63FF', shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 },
  pulseRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#6C63FF' },
  textInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12141A', borderRadius: 20, paddingLeft: 20, paddingRight: 8, height: 56, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  textInput: { flex: 1, color: '#FFFFFF', fontFamily: Fonts.medium, fontSize: 16 },
  sendIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center' },
});
