// app/(tabs)/Frontend/Organizer/org_profile.jsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
  Platform,
  Alert,
} from "react-native";
import BottomNavBar from "../components/navbar";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");
const STORAGE_KEY = "@organizerProfile";

const SAMPLE_EVENTS = [
  
  
  { id: "1", title: "Code Valut", dept: "Department of CS&BS", venue: "MIT Mysore", date: "Sept 19, 2025", time: "11:00 AM",image: "https://picsum.photos/120/120?random=1", registered: true },
  { id: "2", title: "Yuvan", dept: "Department of CS&BS", venue: "MIT Mysore", date: "Dec 08, 2025", time: "09:00 AM",image: "https://picsum.photos/120/120?random=2", registered: true },
  { id: "3", title: "Hackathon 2025", dept: "Department of CS&BS", venue: "MIT Mysore", date: "Oct 02, 2025", time: "10:00 AM",image: "https://picsum.photos/120/120?random=",registered: true },
];



const DEFAULT_PROFILE = {
  name: "Dr. Priya Singh",
  role: "Event Organizer",
  staffId: "MITHODCSBS**",
  department: "CS&BS",
  email: "Priyasingh@gmail.com",
  phone: "+91 99999 9****",
};

export default function OrgProfile() {
  const params = useLocalSearchParams();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [imageUri, setImageUri] = useState(null);

  // Load persisted profile if available
  useEffect(() => {
    (async () => {
      try {
        let m = null;
        try {
          // runtime require so not mandatory at build time
          // eslint-disable-next-line global-require
          m = require("@react-native-async-storage/async-storage");
        } catch (e) {
          m = null;
        }
        const AsyncStorage = m?.default ?? m;
        if (!AsyncStorage) return;
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile(prev => ({ ...prev, ...parsed }));
          if (parsed.imageUri) setImageUri(parsed.imageUri);
        }
      } catch (_) {}
    })();
  }, []);

  // Apply updates when returning from edit screen
  useEffect(() => {
    if (params?.updatedProfile) {
      try {
        const u = JSON.parse(params.updatedProfile);
        setProfile(u);
        if (u.imageUri) setImageUri(u.imageUri);
      } catch (_) {}
    }
  }, [params?.updatedProfile]);

  // Image picker (runtime require of expo-image-picker)
  const pickImage = async () => {
    try {
      let ImagePicker;
      try {
        // eslint-disable-next-line global-require
        ImagePicker = require("expo-image-picker");
      } catch (e) {
        ImagePicker = null;
      }
      if (!ImagePicker) {
        Alert.alert(
          "Image Picker Not Available",
          "Install 'expo-image-picker' to pick real images. Simulating selection.",
          [
            { text: "OK (Simulate)", onPress: () => handlePicked(`https://picsum.photos/160/160?random&_=${Date.now()}`) },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your media library to select an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result) return;
      let uri = null;
      if (result.canceled === false && result.assets && result.assets.length > 0) uri = result.assets[0].uri;
      else if (result.uri) uri = result.uri;
      if (uri) handlePicked(uri);
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Unable to open image picker — using simulated image.");
      handlePicked(`https://picsum.photos/160/160?random&_=${Date.now()}`);
    }
  };

  // Save chosen image and persist locally
  const handlePicked = async (uri) => {
    setImageUri(uri);
    const updated = { ...profile, imageUri: uri };
    setProfile(updated);
    try {
      let m = null;
      try {
        // eslint-disable-next-line global-require
        m = require("@react-native-async-storage/async-storage");
      } catch (e) {
        m = null;
      }
      const AsyncStorage = m?.default ?? m;
      if (AsyncStorage) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  const goEdit = () => {
    const initial = { ...profile, imageUri };
    router.push({
      pathname: "/(tabs)/Frontend/Organizer/org_edit_profile",
      params: { initialData: JSON.stringify(initial) },
    });
  };

  const renderEvent = ({ item }) => (
    <View style={styles.eventCard} key={item.id}>
      <View style={styles.eventImageContainer}>
        <View style={styles.eventImageBlank} />
      </View>

      <View style={styles.eventRight}>
        <View>
          <Text style={styles.eventTitle}>{item.title}</Text>
                  </View>
        <Text style={styles.eventDept}>{item.dept}</Text>
                <Text style={styles.eventMeta}>Venue: {item.venue}</Text>
                <Text style={styles.eventMeta}>Date: {item.date}</Text>
                <Text style={styles.eventMeta}>Time: {item.time}</Text>
        <TouchableOpacity style={styles.viewRegs}>
          <Text style={styles.viewRegsText}>View Registrations</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activeBadgeFloating}>
        <Text style={styles.activeBadgeText}>Active</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.avatarStack}>
            <View style={styles.avatarOuter}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
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
              <Icon name="edit" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.bannerText}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>{profile.role}</Text>
            <Text style={styles.staff}>Staff ID: {profile.staffId}</Text>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={goEdit}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Info</Text>
          <View style={styles.infoCardSmall}>
            <Text style={styles.infoLabel}><Text style={{ fontWeight: '700' }}>Role: </Text>{profile.role}</Text>
            <Text style={styles.infoLabel}><Text style={{ fontWeight: '700' }}>Department: </Text>{profile.department}</Text>
          </View>

          <Text style={styles.sectionTitle}>Contact Detials</Text>
          <View style={styles.infoCardSmall}>
            <Text style={styles.infoLabel}><Text style={{ fontWeight: '700' }}>Email: </Text>{profile.email}</Text>
            <Text style={styles.infoLabel}><Text style={{ fontWeight: '700' }}>Phone: </Text>{profile.phone}</Text>
          </View>

          <View style={styles.eventsHeaderRow}>
            <Text style={styles.sectionTitle}>My Events</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>

          {SAMPLE_EVENTS.map((ev) => (
            <View key={ev.id} style={{ marginBottom: 12 }}>
              {renderEvent({ item: ev })}
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F1FB' },
  headerRow: {
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
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginLeft: 12 },

  banner: {
    backgroundColor: '#cdb9ff',
    margin: 12,
    borderRadius: 12,
    padding: 14,
    paddingBottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  avatarOuter: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarImage: { width: 86, height: 86, borderRadius: 43 },
  avatarPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43  ,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderHead: {
    width: 18,
    height: 18,
    borderRadius: 13,
    backgroundColor: '#fff',
    marginBottom: 6,
  },
  placeholderBody: {
    width: 46,
    height: 20,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    backgroundColor: '#fff',
  },
  avatarStack: { position: 'relative', marginRight: 12 },
  avatarEditBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#2B2B2B",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerText: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#111' },
  role: { color: '#222', marginTop: 6 },
  staff: { color: '#222', opacity: 0.8, marginTop: 4 },
  editBtn: {
    backgroundColor: '#6f52ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    position: 'absolute',
    right: 14,
    bottom: 14,
  },
  editBtnText: { color: '#fff', fontWeight: '700' },

  content: { paddingHorizontal: 12, paddingTop: 8, flex: 1 },
  sectionTitle: { fontWeight: '700', marginTop: 8, marginBottom: 8, fontSize: 16 },
  infoCardSmall: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  infoLabel: { marginBottom: 6 },

  eventsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: '#6f52ff', fontWeight: '700' },

  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 6,
    position: 'relative',
  },
  eventImageContainer: {
    width: 100,
    height: 150,
    borderRadius: 12,
    marginRight: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  eventImageBlank: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#efeef5' },
  eventRight: { flex: 1, height: 150, justifyContent: 'space-between' },
  eventTitle: { fontSize: 18, fontWeight: '700' },
  eventDept: { marginTop: 6, fontWeight: "600", color: "#333" },
  eventDate: { color: '#666', marginTop: 6 },
  eventMeta: { fontSize: 11, color: "#666", marginTop: 2 },
  activeBadgeFloating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#28C76F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  viewRegs: { backgroundColor: '#6f52ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-end' },
  viewRegsText: { color: '#fff', fontWeight: '700' },
});