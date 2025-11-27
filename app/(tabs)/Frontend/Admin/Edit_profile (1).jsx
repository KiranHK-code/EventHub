// EditProfileScreen.js
// Plain JSX React Native component matching the provided screenshot.
// - Big avatar in purple banner, name below avatar
// - Inputs for Info + Contact Details (placeholders as requested)
// - Large "Save Changes" button with shadow
// - Works with react-navigation if `navigation` prop is provided

import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Image,
  Alert,
} from 'react-native';
import BottomNavBar from "../components/navbar";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";

export default function EditProfileScreen({ navigation }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [name, setName] = useState('Dr. Rajesh Singh');
  const [staffId, setStaffId] = useState('');
  const [role, setRole] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUri, setImageUri] = useState(null);

  const STORAGE_KEY = '@adminProfile';

  useEffect(() => {
    (async () => {
      try {
        let m = null;
        try { m = require('@react-native-async-storage/async-storage'); } catch (e) { m = null; }
        const AsyncStorage = m?.default ?? m;
        if (!AsyncStorage) return;
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const p = JSON.parse(saved);
          if (p.name) setName(p.name);
          if (p.staffId) setStaffId(p.staffId);
          if (p.role) setRole(p.role);
          if (p.institution) setInstitution(p.institution);
          if (p.email) setEmail(p.email);
          if (p.phone) setPhone(p.phone);
          if (p.imageUri) setImageUri(p.imageUri);
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (params?.initialData) {
      try {
        const parsed = JSON.parse(params.initialData);
        if (parsed.name) setName(parsed.name);
        if (parsed.staffId) setStaffId(parsed.staffId);
        if (parsed.role) setRole(parsed.role);
        if (parsed.institution) setInstitution(parsed.institution);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.imageUri) setImageUri(parsed.imageUri);
      } catch (error) {
        console.warn('Failed to parse initialData', error);
      }
    }
  }, [params?.initialData]);

  const pickImage = async () => {
    try {
      let ImagePicker;
      try { ImagePicker = require('expo-image-picker'); } catch (e) { ImagePicker = null; }
      if (!ImagePicker) {
        Alert && Alert.alert && Alert.alert('Image Picker Not Available', 'Install expo-image-picker to pick images. Simulating selection.');
        const uri = `https://picsum.photos/160/160?random&_=${Date.now()}`;
        setImageUri(uri);
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert && Alert.alert && Alert.alert('Permission required', 'Please allow access to your media library to select an image.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
      let uri = null;
      if (!res) return;
      if (res.canceled === false && res.assets && res.assets.length > 0) uri = res.assets[0].uri;
      else if (res.uri) uri = res.uri;
      if (uri) setImageUri(uri);
    } catch (err) {
      console.warn(err);
    }
  };

  const topPadding =
    Platform.OS === 'android' && typeof StatusBar.currentHeight === 'number'
      ? StatusBar.currentHeight + 6
      : 8;

  async function onSave() {
    const updated = { name, staffId, role, institution, email, phone, imageUri };
    console.log('Saving profile:', updated);
    try {
      let m = null;
      try { m = require('@react-native-async-storage/async-storage'); } catch (e) { m = null; }
      const AsyncStorage = m?.default ?? m;
      if (AsyncStorage) {
        const result = await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log('AsyncStorage save result:', result);
      } else {
        console.warn('AsyncStorage not available');
      }
    } catch (e) {
      console.error('Save error:', e);
    }
    console.log('Navigating back...');
    const payload = JSON.stringify(updated);
    if (navigation && navigation.navigate) {
      navigation.navigate('Profile', { updatedProfile: payload });
      return;
    }
    router.replace({
      pathname: '/(tabs)/Frontend/Admin/profile1',
      params: { updatedProfile: payload },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <TouchableOpacity
            onPress={() => {
              if (navigation && navigation.goBack) {
                navigation.goBack();
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            <MaterialIcon name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Purple banner with avatar and name */}
          <View style={styles.banner}>
            <TouchableOpacity onPress={pickImage} accessibilityRole="imagebutton">
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={[styles.avatarOuter, { overflow: 'hidden' }]} />
              ) : (
                <View style={styles.avatarOuter}>
                  <View style={styles.placeholderIcon}>
                    <View style={styles.placeholderHead} />
                    <View style={styles.placeholderBody} />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.bannerName}>{name}</Text>
          </View>

          {/* Info Section */}
          <Text style={styles.sectionTitle}>Info</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Name"
              placeholderTextColor="#9b9b9b"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Staff ID"
              placeholderTextColor="#9b9b9b"
              value={staffId}
              onChangeText={setStaffId}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your Role"
              placeholderTextColor="#9b9b9b"
              value={role}
              onChangeText={setRole}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Institution Name"
              placeholderTextColor="#9b9b9b"
              value={institution}
              onChangeText={setInstitution}
            />
          </View>

          {/* Contact Details */}
          <Text style={styles.sectionTitle}>Contact Detials</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Enter email-address"
              placeholderTextColor="#9b9b9b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Phone Number"
              placeholderTextColor="#9b9b9b"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={onSave} accessibilityRole="button">
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>

          <View style={{ height: 160 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3eefe' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#000',
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { height: 2, width: 0 },
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

  container: { padding: 16, paddingBottom: 40 },

  banner: {
    backgroundColor: '#cdb9ff', // purple banner
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 18,
    // subtle shadow / lift
    ...Platform.select({
      web: { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 },
    }),
  },

  avatarOuter: {
    width: 96,
    height: 96,
    borderRadius: 96,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    // inner shadow
    ...Platform.select({
      web: { boxShadow: '0 6px 12px rgba(0,0,0,0.18)' },
      default: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, elevation: 6 },
    }),
  },
  placeholderIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  placeholderHead: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', marginBottom: 6 },
  placeholderBody: { width: 40, height: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#fff' },

  bannerName: { fontSize: 20, fontWeight: '800', color: '#0b0b0b' },

  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8, color: '#231f20' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    // card shadow
    ...Platform.select({
      web: { boxShadow: '0 6px 14px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
    }),
  },

  input: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 14,
    color: '#111',
  },

  saveBtn: {
    backgroundColor: '#6f52ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    // button shadow
    ...Platform.select({
      web: { boxShadow: '0 10px 20px rgba(111,82,255,0.28)' },
      default: { shadowColor: '#6f52ff', shadowOpacity: 0.28, shadowRadius: 6, elevation: 6 },
    }),
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
