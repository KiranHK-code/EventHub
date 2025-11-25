// edit_profile.jsx (No changes needed, kept for context)
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import BottomNavBar from "../components/navbar";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function EditProfileScreen() {
  const params = useLocalSearchParams();
  const initialData = params.initialData ? JSON.parse(params.initialData) : {};

  // Initialize state with data passed from ProfileScreen
  const [name, setName] = useState(initialData.name || '');
  const [usn, setUsn] = useState(initialData.roll || '');
  const [department, setDepartment] = useState(initialData.dept || '');
  const [year, setYear] = useState(initialData.year || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [imageUri, setImageUri] = useState(initialData.imageUri || null);

  const topPadding =
    Platform.OS === 'android' && typeof StatusBar.currentHeight === 'number'
      ? StatusBar.currentHeight + 8
      : 8;

  function onSave() {
    // 1. Construct the updated profile object
    const updatedProfile = {
      name,
      roll: usn, // USN is displayed as 'roll' on the profile strip
      dept: department,
      year,
      email,
      phone,
      imageUri,
    };

    console.log('Saved profile:', updatedProfile);

    // 2. Navigate back to the Profile screen and pass the updated profile
    // as a param so the Profile screen can update immediately.
    router.replace({
      pathname: '/(tabs)/Frontend/Student/profile',
      params: { updatedProfile: JSON.stringify(updatedProfile) },
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
        {/* Fixed Header */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            <Icon name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + Name Banner */}
          <View style={styles.banner}>
            <View style={styles.avatarOuter}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={[styles.avatarInner, { width: 56, height: 56, borderRadius: 28 }]} />
                ) : (
                  <View style={styles.placeholderIcon}>
                    <View style={styles.placeholderHead} />
                    <View style={styles.placeholderBody} />
                  </View>
                )}
            </View>
            <Text style={styles.nameText}>{name}</Text>
          </View>

          {/* Academic Info */}
          <Text style={styles.sectionTitle}>Academic Info</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your USN (Roll Number)"
              placeholderTextColor="#999"
              value={usn}
              onChangeText={setUsn}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your Department"
              placeholderTextColor="#999"
              value={department}
              onChangeText={setDepartment}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Year of study"
              placeholderTextColor="#999"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
            />
          </View>

          {/* Contact Details */}
          <Text style={styles.sectionTitle}>Contact Details</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Enter email-address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Phone Number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Save Button */}
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
  safe: { flex: 1, backgroundColor: '#f4eefe' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#000',
    paddingBottom: 16,
    paddingTop:
      Platform.OS === 'android' && typeof StatusBar.currentHeight === 'number'
        ? StatusBar.currentHeight + 16
        : 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { height: 2, width: 0 },
    position: 'sticky',
    top: 0,
    zIndex: 10,
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
    backgroundColor: '#cdb9ff',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 18,
  },
  avatarOuter: {
    width: 96,
    height: 96,
    borderRadius: 96,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    // subtle shadow
    ...Platform.select({
      web: { boxShadow: '0 6px 12px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
    }),
  },
  avatarInner: { width: 56, height: 56, borderRadius: 56, backgroundColor: '#111' },
  placeholderIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  placeholderHead: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', marginBottom: 6 },
  placeholderBody: { width: 40, height: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#fff' },
  nameText: { fontSize: 20, fontWeight: '800', color: '#111' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 6, color: '#222' },
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
    // small inner shadow on web for depth
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },

  saveBtn: {
    backgroundColor: '#6f52ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    // button shadow
    ...Platform.select({
      web: { boxShadow: '0 8px 18px rgba(111,82,255,0.28)' },
      default: { shadowColor: '#6f52ff', shadowOpacity: 0.25, shadowRadius: 6, elevation: 6 },
    }),
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});