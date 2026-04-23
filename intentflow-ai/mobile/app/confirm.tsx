import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, ActivityIndicator
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Fonts, Radius } from '@/constants/theme';
import { confirmHitl, rejectHitl } from '@/services/api';
import { ScrollView } from 'react-native-gesture-handler';

export default function ConfirmTaskScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [isProcessing, setIsProcessing] = useState(false);

  // Parse task data from navigation params
  const task = params.task ? JSON.parse(params.task as string) : {};
  const transcript = params.transcript as string || '';
  const hitlId = params.hitlId as string || '';

  // Extract task fields with fallbacks
  const taskTitle = task.title || task.description || 'New Intent';
  const taskPriority = task.priority || 'medium';
  const taskCategory = task.category || 'general';
  const dueDate = task.due_date ? new Date(task.due_date).toLocaleString() : 'Not specified';
  const taskId = task.id || `INT-${Math.floor(1000 + Math.random() * 9000)}`;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1,   useNativeDriver: true, damping: 15, stiffness: 120 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (hitlId) {
        await confirmHitl(hitlId);
      }
      // Wait briefly for backend to process before navigating
      await new Promise(resolve => setTimeout(resolve, 800));
      // Success - go to the new Intents history tab with refresh param
      router.replace('/(tabs)/intents?refresh=true');
    } catch (err) {
      console.error('Confirm error:', err);
      // Fallback
      router.replace('/(tabs)/intents');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      if (hitlId) {
        await rejectHitl(hitlId, 'User cancelled');
      }
      router.back();
    } catch (err) {
      console.error('Cancel error:', err);
      router.back();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B0F' }}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={handleCancel} 
          style={[styles.backBtn, { backgroundColor: '#1E2130' }]}
        >
          <Feather name="chevron-left" size={20} color="#A0A8C0" />
        </TouchableOpacity>
        <StatusPill variant="actionReady" label="SYSTEM READY" />
        <View style={styles.avatarPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.heroSection, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#8B83FF', '#6C63FF']}
            style={styles.heroBadge}
          >
            <Feather name="check" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.heroTitle}>Confirm Intent?</Text>
          <Text style={styles.heroSubtitle}>High confidence parse successful</Text>
        </Animated.View>

        <View style={styles.intentCard}>
          <View style={styles.cardHeader}>
             <Text style={styles.idLabel}>ID: {taskId}</Text>
             <View style={[styles.confirmedBadge, { 
               backgroundColor: taskPriority === 'high' ? 'rgba(255,80,80,0.15)' : 
                               taskPriority === 'low' ? 'rgba(100,200,255,0.15)' : 
                               'rgba(0,200,150,0.12)'
             }]}>
                <Text style={[styles.confirmedText, {
                  color: taskPriority === 'high' ? '#FF5050' : 
                         taskPriority === 'low' ? '#64C8FF' : 
                         '#00C896'
                }]}>{taskPriority.toUpperCase()}</Text>
             </View>
          </View>

          <View style={styles.detailRow}>
             <View style={styles.iconBox}>
                <Feather name="file-text" size={16} color="#6C63FF" />
             </View>
             <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>TITLE</Text>
                <Text style={styles.detailValue}>{taskTitle}</Text>
             </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
             <View style={styles.iconBox}>
                <Feather name="layers" size={16} color="#6C63FF" />
             </View>
             <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>CATEGORY</Text>
                <Text style={styles.detailValue}>{taskCategory.charAt(0).toUpperCase() + taskCategory.slice(1)}</Text>
             </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
             <View style={styles.iconBox}>
                <Feather name="clock" size={16} color="#FF8C42" />
             </View>
             <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>DUE DATE</Text>
                <Text style={styles.detailValue}>{dueDate}</Text>
             </View>
          </View>
        </View>

        <View style={styles.actions}>
           <TouchableOpacity
             style={styles.confirmBtn}
             onPress={handleConfirm}
             activeOpacity={0.8}
             disabled={isProcessing}
           >
              <LinearGradient
                colors={['#6C63FF', '#4A3FF7']}
                style={styles.gradBtn}
              >
                {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>Confirm Task ✓</Text>}
              </LinearGradient>
           </TouchableOpacity>

           <TouchableOpacity
             style={styles.editBtn}
             onPress={() => router.push('/review')}
             disabled={isProcessing}
           >
              <Text style={styles.editText}>Edit Details</Text>
           </TouchableOpacity>

           <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={isProcessing}>
              <Text style={styles.cancelText}>CANCEL REQUEST</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholder: { width: 44 },
  body: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 60 },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  heroBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0px 0px 15px rgba(108,99,255,0.4)', elevation: 12 },
  heroTitle: { fontFamily: Fonts.displayBold, fontSize: 28, color: '#FFFFFF', letterSpacing: -0.8 },
  heroSubtitle: { fontFamily: Fonts.regular, fontSize: 15, color: '#A0A8C0', marginTop: 4 },
  intentCard: { backgroundColor: '#12141A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  idLabel: { fontFamily: Fonts.medium, fontSize: 11, color: '#5A6280', letterSpacing: 0.5 },
  confirmedBadge: { backgroundColor: 'rgba(0,200,150,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  confirmedText: { color: '#00C896', fontSize: 10, fontFamily: Fonts.bold, letterSpacing: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1C1F2E', alignItems: 'center', justifyContent: 'center' },
  detailInfo: { marginLeft: 16 },
  detailLabel: { fontFamily: Fonts.medium, fontSize: 10, color: '#5A6280', letterSpacing: 1.5 },
  detailValue: { fontFamily: Fonts.bold, fontSize: 17, color: '#FFFFFF', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 20 },
  actions: { marginTop: 40, gap: 12 },
  confirmBtn: { borderRadius: 16, overflow: 'hidden', boxShadow: '0px 0px 16px rgba(108,99,255,0.4)', elevation: 8 },
  gradBtn: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFF', fontFamily: Fonts.bold, fontSize: 16 },
  editBtn: { backgroundColor: '#1E2130', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  editText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 15 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#5A6280', fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 2 },
});
