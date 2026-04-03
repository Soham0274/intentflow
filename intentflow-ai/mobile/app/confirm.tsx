import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Fonts, Radius } from '@/constants/theme';

export default function ConfirmTaskScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1,   useNativeDriver: true, damping: 15, stiffness: 120 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B0F' }}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={() => router.back()} 
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
             <Text style={styles.idLabel}>ID: INT-8821</Text>
             <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>CONFIRMED</Text>
             </View>
          </View>

          <View style={styles.detailRow}>
             <View style={styles.iconBox}>
                <Feather name="user" size={16} color="#6C63FF" />
             </View>
             <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>ENTITY</Text>
                <Text style={styles.detailValue}>Contact</Text>
             </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
             <View style={styles.iconBox}>
                <Feather name="layers" size={16} color="#6C63FF" />
             </View>
             <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>ACTION TYPE</Text>
                <Text style={styles.detailValue}>Follow up · Task List</Text>
             </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
             <View style={styles.iconBox}>
                <Feather name="clock" size={16} color="#FF8C42" />
             </View>
             <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>TRIGGER</Text>
                <Text style={styles.detailValue}>Today 3:00 PM</Text>
             </View>
          </View>
        </View>

        <View style={styles.actions}>
           <TouchableOpacity
             style={styles.confirmBtn}
             onPress={() => router.replace('/')}
             activeOpacity={0.8}
           >
              <LinearGradient
                colors={['#6C63FF', '#4A3FF7']}
                style={styles.gradBtn}
              >
                <Text style={styles.confirmText}>Confirm Task ✓</Text>
              </LinearGradient>
           </TouchableOpacity>

           <TouchableOpacity
             style={styles.editBtn}
             onPress={() => router.push('/review')}
           >
              <Text style={styles.editText}>Edit Details</Text>
           </TouchableOpacity>

           <TouchableOpacity style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCEL REQUEST</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { ScrollView } from 'react-native-gesture-handler';

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
