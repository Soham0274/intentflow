import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ThemedToggle } from '../components/ThemedToggle';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from '../store/AuthContext';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Integration row
interface IntegrationRowProps {
  icon:    React.ReactNode;
  name:    string;
  sub:     string;
  status:  'connected' | 'disconnected';
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({ icon, name, sub, status }) => {
  const { colors } = useTheme();
  return (
    <View style={[iStyles.row, { borderBottomColor: 'rgba(255,255,255,0.04)' }]}>
      <View style={[iStyles.iconBox, { backgroundColor: '#1C1F2E' }]}>{icon}</View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={[styles.itemTitle, { color: '#FFFFFF' }]}>{name}</Text>
        <Text style={[styles.itemSub, { color: '#5A6280' }]}>{sub}</Text>
      </View>
      {status === 'connected' ? (
        <View style={iStyles.activeBadge}>
          <Text style={iStyles.activeText}>ACTIVE</Text>
        </View>
      ) : (
        <TouchableOpacity>
          <Text style={iStyles.connectText}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const iStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  iconBox:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activeBadge: { backgroundColor: 'rgba(0,200,150,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeText: { color: '#00C896', fontSize: 10, fontFamily: Fonts.bold, letterSpacing: 1 },
  connectText: { color: '#6C63FF', fontSize: 14, fontFamily: Fonts.bold },
});

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [voiceSensitivity, setVoiceSensitivity] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(false);

  // Get real user data from AuthContext/Supabase
  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0B0F' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Profile</Text>
        <TouchableOpacity style={styles.settingsBtn}>
           <Feather name="settings" size={20} color="#5A6280" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
             <LinearGradient
               colors={['#00C896', '#6C63FF', '#4A3FF7']}
               start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
               style={styles.avatarRing}
             />
             <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>{userInitial}</Text>
             </View>
             <View style={styles.onlineDot} />
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        <View style={styles.section}>
           <Text style={styles.sectionLabel}>ASSISTANT PREFERENCES</Text>
           <View style={styles.card}>
              <View style={styles.prefRow}>
                 <View style={[styles.prefIcon, { backgroundColor: 'rgba(108, 99, 255, 0.1)' }]}>
                    <Feather name="mic" size={18} color="#6C63FF" />
                 </View>
                 <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.itemTitle}>Voice Sensitivity</Text>
                    <Text style={styles.itemSubText}>High threshold mode</Text>
                 </View>
                 <ThemedToggle value={voiceSensitivity} onChange={setVoiceSensitivity} />
              </View>
              <View style={styles.divider} />
              <View style={styles.prefRow}>
                 <View style={[styles.prefIcon, { backgroundColor: 'rgba(0, 200, 150, 0.1)' }]}>
                    <Feather name="check-circle" size={18} color="#00C896" />
                 </View>
                 <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.itemTitle}>Auto-Confirm Intent</Text>
                    <Text style={styles.itemSubText}>Skip HITL for high confidence</Text>
                 </View>
                 <ThemedToggle value={autoConfirm} onChange={setAutoConfirm} />
              </View>
           </View>
        </View>

        <View style={styles.section}>
           <Text style={styles.sectionLabel}>CONNECTED ECOSYSTEM</Text>
           <View style={styles.card}>
              <IntegrationRow
                icon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
                name="Google Calendar"
                sub="Primary workspace · Sync active"
                status="connected"
              />
              <IntegrationRow
                icon={<MaterialCommunityIcons name="microsoft-outlook" size={20} color="#5A6280" />}
                name="Outlook Calendar"
                sub="Enterprise account"
                status="disconnected"
              />
           </View>
        </View>

        <View style={styles.logoutSection}>
           <TouchableOpacity 
             style={styles.logoutBtn} 
             onPress={handleLogout}
           >
              <Feather name="log-out" size={20} color="#FF4D4D" />
              <Text style={styles.logoutText}>SIGN OUT OF SESSION</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1E2130', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 18, color: '#FFFFFF' },
  settingsBtn: { width: 44, alignItems: 'center' },
  avatarSection: { alignItems: 'center', paddingVertical: 40 },
  avatarContainer: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { position: 'absolute', width: 92, height: 92, borderRadius: 46 },
  avatarInner: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#0A0B0F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0A0B0F' },
  avatarInitial: { fontFamily: Fonts.displayBold, fontSize: 32, color: '#FFFFFF' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#00C896', borderWidth: 3, borderColor: '#0A0B0F' },
  userName: { fontFamily: Fonts.displayBold, fontSize: 24, color: '#FFFFFF', marginTop: 16, letterSpacing: -0.5 },
  userEmail: { fontFamily: Fonts.medium, fontSize: 13, color: '#5A6280', marginTop: 4 },
  section: { marginTop: 32, paddingHorizontal: 24 },
  sectionLabel: { fontFamily: Fonts.medium, fontSize: 11, color: '#5A6280', letterSpacing: 1.5, marginBottom: 12 },
  card: { backgroundColor: '#12141A', borderRadius: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  prefIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontFamily: Fonts.bold, fontSize: 15, color: '#FFFFFF' },
  itemSub: { fontFamily: Fonts.regular, fontSize: 13, marginTop: 2 },
  itemSubText: { fontFamily: Fonts.medium, fontSize: 12, color: '#5A6280', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  logoutSection: { marginTop: 48, paddingHorizontal: 24 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,77,77,0.3)', gap: 12 },
  logoutText: { fontFamily: Fonts.bold, fontSize: 11, color: '#FF4D4D', letterSpacing: 2 },
});
