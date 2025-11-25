// app/(tabs)/Frontend/Organizer/org_edit_profile.jsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import BottomNavBar from "../components/navbar";
import Icon from "react-native-vector-icons/MaterialIcons";

const STORAGE_KEY = "@organizerProfile";

export default function OrgEditProfile() {
  const params = useLocalSearchParams();
  const initialData = params.initialData ? JSON.parse(params.initialData) : {};

  const [name, setName] = useState(initialData.name || "Dr. Priya Singh");
  const [staffId, setStaffId] = useState(initialData.staffId || "");
  const [role, setRole] = useState(initialData.role || "");
  const [department, setDepartment] = useState(initialData.department || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [imageUri, setImageUri] = useState(initialData.imageUri || null);

  // Image picker for edit screen (runtime)
  async function pickImage() {
    try {
      let ImagePicker;
      try {
        // eslint-disable-next-line global-require
        ImagePicker = require("expo-image-picker");
      } catch (e) {
        ImagePicker = null;
      }

      if (!ImagePicker) {
        Alert.alert("Image Picker Not Available", "Install 'expo-image-picker' to pick real images. Simulating selection.", [
          { text: "OK (Simulate)", onPress: () => setImageUri(`https://picsum.photos/96/96?random&_=${Date.now()}`) },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your media library to select an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result) return;
      let uri = null;
      if (result.canceled === false && result.assets && result.assets.length > 0) uri = result.assets[0].uri;
      else if (result.uri) uri = result.uri;
      if (uri) setImageUri(uri);
    } catch (err) {
      console.warn("Image pick error", err);
      Alert.alert("Error", "Unable to open image picker — using simulated image.");
      setImageUri(`https://picsum.photos/96/96?random&_=${Date.now()}`);
    }
  }

  function onSave() {
    const updatedProfile = {
      name,
      role,
      staffId,
      department,
      email,
      phone,
      imageUri,
    };

    // Persist and navigate back to org_profile (send params for immediate update)
    (async () => {
      try {
        let m = null;
        try {
          // eslint-disable-next-line global-require
          m = require("@react-native-async-storage/async-storage");
        } catch (e) {
          m = null;
        }
        const AsyncStorage = m?.default ?? m;
        if (AsyncStorage) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      } catch (e) {
        console.warn("Unable to save locally", e);
      } finally {
        router.replace({
          pathname: "/(tabs)/Frontend/Organizer/org_profile",
          params: { updatedProfile: JSON.stringify(updatedProfile) },
        });
      }
    })();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.banner}>
            <TouchableOpacity onPress={pickImage} accessibilityRole="button">
              <View style={styles.avatarOuter}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.avatarInner} />
                ) : (
                  <View style={styles.placeholderIcon}>
                    <View style={styles.placeholderHead} />
                    <View style={styles.placeholderBody} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.nameText}>{name}</Text>
          </View>

          <Text style={styles.sectionTitle}>Info</Text>
          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="Enter Your Name" placeholderTextColor="#999" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Staff ID" placeholderTextColor="#999" value={staffId} onChangeText={setStaffId} />
            <TextInput style={styles.input} placeholder="Role" placeholderTextColor="#999" value={role} onChangeText={setRole} />
            <TextInput style={styles.input} placeholder="Department" placeholderTextColor="#999" value={department} onChangeText={setDepartment} />
          </View>

          <Text style={styles.sectionTitle}>Contact Details</Text>
          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={onSave}><Text style={styles.saveBtnText}>Save Changes</Text></TouchableOpacity>
          <View style={{ height: 160 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4EEFB' },
  headerBar: {
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

  container: { padding: 16, paddingBottom: 40, paddingTop: 12 },
  banner: { backgroundColor: '#cdb9ff', borderRadius: 10, alignItems: 'center', paddingVertical: 18, marginBottom: 18 },
  avatarOuter: { width: 96, height: 96, borderRadius: 96, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarInner: { width: 72, height: 72, borderRadius: 36 },
  placeholderIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  placeholderHead: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', marginBottom: 6 },
  placeholderBody: { width: 40, height: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#fff' },
  nameText: { fontSize: 20, fontWeight: '800', color: '#111' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 6, color: '#222' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 14 },
  input: { backgroundColor: '#fafafa', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 14, color: '#111' },

  saveBtn: { backgroundColor: '#6f52ff', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});