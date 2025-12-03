// ProfileScreen.js
// Plain JSX React Native component (Expo-friendly).
// - Shows profile header, info cards, contact details, approved events list
// - Many sample events so the approved events section is scrollable

import React, { useCallback, useState, useEffect, useMemo} from 'react';
import {useRouter, useLocalSearchParams, useFocusEffect} from 'expo-router';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Alert,
} from 'react-native';
import BottomNavBar from "../components/navbar";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Constants from "expo-constants";

const cleanUrl = (value) => {
  if (!value) return null;
  let url = value.trim();
  if (!/^https?:\/\//.test(url)) { url = `http://${url}`; }
  return url.replace(/\/$/, "");
};

const getBaseUrl = () => {
  const envUrl = cleanUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000`;
  }
  if (Platform.OS === 'android') return "http://10.0.2.2:5000";
  if (Platform.OS === 'ios') return "http://localhost:5000";
  return "http://192.168.93.107:5000";
};

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const apiBase = useMemo(() => getBaseUrl(), []);

  const [profile, setProfile] = useState({
    name: '',
    role: 'Admin',
    staffId: '',
    institution: '',
    email: '',
    phone: '',
    imageUri: null,
  });
  const [approvedEvents, setApprovedEvents] = useState([]);

  const STORAGE_KEY = '@adminProfile';

  const loadProfile = useCallback(async () => {
    try {
      let m = null;
      try {
        // eslint-disable-next-line global-require
        m = require('@react-native-async-storage/async-storage');
      } catch (e) {
        m = null;
      }
      const AsyncStorage = m?.default ?? m;
      if (!AsyncStorage) return;
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.warn('Failed to load profile', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      fetchApprovedEvents();
    }, [loadProfile, fetchApprovedEvents])
  );

  const fetchApprovedEvents = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/review`);
      const allEvents = await res.json();
      if (Array.isArray(allEvents)) {
        // Filter for events that have the status 'approved'
        setApprovedEvents(allEvents.filter(event => event.basicInfo?.status === 'approved'));
      }
    } catch (err) {
      console.error("Failed to fetch approved events:", err);
    }
  }, [apiBase]);

  // Accept updated profile passed back from the edit screen and persist it
  useEffect(() => {
    if (!params?.updatedProfile) return;
    try {
      const parsed = JSON.parse(params.updatedProfile);
      setProfile(prev => ({ ...prev, ...parsed }));

      (async () => {
        try {
          let m = null;
          try { m = require('@react-native-async-storage/async-storage'); } catch (e) { m = null; }
          const AsyncStorage = m?.default ?? m;
          if (AsyncStorage) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {
          console.warn('Failed to persist updated profile', e);
        }
      })();
    } catch (e) {
      console.warn('Failed to parse updatedProfile param', e);
    }
  }, [params?.updatedProfile]);

  const pickImage = async () => {
    try {
      let ImagePicker;
      try {
        // eslint-disable-next-line global-require
        ImagePicker = require('expo-image-picker');
      } catch (e) {
        ImagePicker = null;
      }
      if (!ImagePicker) {
        Alert.alert('Image Picker Not Available', 'Install expo-image-picker to pick images. Simulating selection.', [
          { text: 'OK', onPress: async () => {
            const uri = `https://picsum.photos/160/160?random&_=${Date.now()}`;
            const updated = { ...profile, imageUri: uri };
            setProfile(updated);
            try {
              const m = require('@react-native-async-storage/async-storage');
              const AsyncStorage = m?.default ?? m;
              if (AsyncStorage) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (_) {}
          } },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your media library to select an image.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
      let uri = null;
      if (!res) return;
      if (res.canceled === false && res.assets && res.assets.length > 0) uri = res.assets[0].uri;
      else if (res.uri) uri = res.uri;
      if (uri) {
        const updated = { ...profile, imageUri: uri };
        setProfile(updated);
        try {
          let m = null;
          try { m = require('@react-native-async-storage/async-storage'); } catch (e) { m = null; }
          const AsyncStorage = m?.default ?? m;
          if (AsyncStorage) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (_) {}
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Unable to open image picker — using simulated image.');
      const uri = `https://picsum.photos/160/160?random&_=${Date.now()}`;
      const updated = { ...profile, imageUri: uri };
      setProfile(updated);
      try {
        const m = require('@react-native-async-storage/async-storage');
        const AsyncStorage = m?.default ?? m;
        if (AsyncStorage) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
    }
  };
  const topPadding =
    Platform.OS === 'android' && typeof StatusBar.currentHeight === 'number'
      ? StatusBar.currentHeight + 8
      : 8;

  const headerShadow =
    Platform.OS === 'web'
      ? { boxShadow: '0 6px 14px rgba(0,0,0,0.08)' }
      : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }, headerShadow]}>
        <TouchableOpacity
          style={styles.backBtn}
          accessibilityLabel="Back"
          onPress={() => router.back()}
        >
          <MaterialIcon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile banner */}
        <View style={styles.profileBanner}>
          <View style={styles.avatarStack}>
            <View style={styles.avatarPlaceholder}>
              {profile.imageUri ? (
                <Image source={{ uri: profile.imageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.placeholderIcon}>
                  <View style={styles.placeholderHead} />
                  <View style={styles.placeholderBody} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.avatarEditBtn}
              accessibilityRole="button"
              onPress={pickImage}
            >
              <MaterialIcon name="edit" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.nameText}>{profile.name}</Text>
            <Text style={styles.roleText}>{profile.role}</Text>
            <Text style={styles.smallMuted}>Staff ID: {profile.staffId}</Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/Frontend/Admin/Edit_profile (1)',
                params: { initialData: JSON.stringify(profile) },
              })
            }
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <Text style={styles.sectionTitle}>Info</Text>
        <View style={[styles.card, styles.smallCardShadow]}>
          <Text style={styles.infoLabel}>
            <Text style={{ fontWeight: '700' }}>Role: </Text>
            {profile.role}
          </Text>
          <Text style={[styles.infoLabel, { marginTop: 6 }]}>
            <Text style={{ fontWeight: '700' }}>Institution: </Text>
            {profile.institution ?? '—'}
          </Text>
        </View>

        {/* Contact Details */}
        <Text style={styles.sectionTitle}>Contact Details</Text>
        <View style={[styles.card, styles.smallCardShadow]}>
          <Text style={styles.infoLabel}>
            <Text style={{ fontWeight: '700' }}>Email: </Text>
            {profile.email}
          </Text>
          <Text style={[styles.infoLabel, { marginTop: 6 }]}>
            <Text style={{ fontWeight: '700' }}>Phone: </Text>
            {profile.phone}
          </Text>
        </View>

        {/* Approved Events header */}
        <View style={styles.eventsHeaderRow}>
          <Text style={styles.sectionTitle}>Approved Events</Text>
          <TouchableOpacity style={styles.viewAllBtn} accessibilityRole="button">
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Approved events list (scrollable within the main scroll) */}
        {approvedEvents.map((event) => (
          <View key={event.basicInfo._id} style={[styles.eventCard, styles.smallCardShadow]}>
            <View style={styles.cardRow}>
              {event.basicInfo.poster ? (
                <Image 
                  source={{ uri: event.basicInfo.poster }} 
                  style={styles.eventThumb} 
                />
              ) : (
                <View style={styles.eventThumb} />
              )}
              <View style={styles.eventBody}>
                <View>
                  <Text style={styles.eventTitle}>{event.basicInfo.eventName}</Text>
                  <Text style={styles.eventMeta}>{event.basicInfo.dept}</Text>
                  <Text style={styles.eventMeta}>Venue: {event.eventDetails.venue}</Text>
                  <Text style={styles.eventMeta}>Date: {event.eventDetails.startDate ? new Date(event.eventDetails.startDate).toLocaleDateString() : 'N/A'}</Text>
                  <Text style={styles.eventMeta}>Time: {event.eventDetails.startTime || 'N/A'}</Text>
                </View>
                <TouchableOpacity style={styles.viewButton} accessibilityRole="button" onPress={()=>router.push("/(tabs)/Frontend/Admin/admin_register",{eventId:event.basicInfo._id})}>
                  <Text style={styles.viewButtonText}>View Registrations</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statusPillFloating}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 160 }} />
      </ScrollView>
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f1fb' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    marginRight: 12,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },

  container: { padding: 16, paddingBottom: 140 },

  profileBanner: {
    backgroundColor: '#cdb9ff',
    borderRadius: 8,
    padding: 16,
    paddingBottom: 56,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  avatarStack: { marginRight: 12, position: 'relative' },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 6,
  },
  placeholderBody: {
    width: 36,
    height: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#fff',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1 },
  nameText: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  roleText: { fontSize: 13, color: '#222' },
  smallMuted: { color: '#222', opacity: 0.7, marginTop: 4 },

  editButton: {
    backgroundColor: '#6f52ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    position: 'absolute',
    right: 16,
    bottom: 12,
  },
  editButtonText: { color: '#fff', fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },

  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
  smallCardShadow: Platform.select({
    web: { boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
    default: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  }),

  infoLabel: { color: '#222' },

  eventsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 6 },
  viewAllBtn: { backgroundColor: '#6f52ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
  viewAllText: { color: '#fff', fontWeight: '700' },

  eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 14, position: 'relative' },
  cardRow: { flexDirection: 'row' },
  eventThumb: { width: 100, height: 150, borderRadius: 8, backgroundColor: '#e6e6e6', marginRight: 12 },
  eventBody: { flex: 1, justifyContent: 'space-between', minHeight: 150 },
  eventTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  eventDept: { fontSize: 12, marginTop: 6, fontWeight: "600", color: "#333" },
  eventDate: { color: '#666', marginTop: 6 },
  eventMeta: { fontSize: 12, color: "#666", marginTop: 2 },

  statusPillFloating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#28C76F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusText: { color: '#fff', fontWeight: '700' },

  viewButton: { backgroundColor: '#6f52ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-end' },
  viewButtonText: { color: '#fff', fontWeight: '700' },
});
