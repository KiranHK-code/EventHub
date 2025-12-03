import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import React, { useState, useCallback, memo, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Dimensions,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import BottomNavBar from "../components/navbar";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// NOTE: You must install 'expo-image-picker' for this feature to work!
// import * as ImagePicker from 'expo-image-picker'; 

const { width } = Dimensions.get("window");

/* ------------------ API and Auth Helpers ------------------ */

const cleanUrl = (value) => {
  if (!value) return null;
  let url = value.trim();
  if (!/^https?:\/\//.test(url)) {
    url = `http://${url}`;
  }
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

  return "http://localhost:5000";
};

const getStudentId = async () => {
  const studentData = await AsyncStorage.getItem('student_profile');
  return studentData ? JSON.parse(studentData)._id : null;
};

/* ------------------ Initial Profile Data & Events ------------------ */
const INITIAL_PROFILE_DATA = {
  name: "",
  roll: "",
  dept: "",
  year: "",
  email: "",
  phone: "",
};
const INITIAL_IMAGE_URI = null;

/* ------------------ Presentational components ------------------ */

const Header = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backBtn} onPress={onBack}>
      <Icon name="arrow-back" size={26} color="#fff" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Profile</Text>
    <View style={{ width: 46 }} />
  </View>
);

const ProfileStrip = ({ name, roll, profileImageUri, onAvatarPress, onEdit }) => (
  <View style={styles.profileStrip}>
    <View style={styles.avatarWrap}>
      <View style={styles.avatarOuter}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.avatarImage} resizeMode="cover" />
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
        onPress={onAvatarPress}
      >
        <Icon name="edit" size={18} color="#fff" />
      </TouchableOpacity>
    </View>

    <View style={styles.profileText}>
      <Text style={styles.profileName}>{name}</Text>
      <Text style={styles.profileRoll}>{roll}</Text>
    </View>

    <TouchableOpacity
      style={styles.editButton}
      accessibilityRole="button"
      onPress={onEdit}
    >
      <Text style={styles.editButtonText}>Edit Profile</Text>
    </TouchableOpacity>
  </View>
);

const InfoCard = ({ title, children }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoTitle}>{title}</Text>
    <View style={styles.infoBody}>{children}</View>
  </View>
);

const RegisteredBadge = () => (
  <View style={styles.registeredBadge}>
    <Text style={styles.registeredBadgeText}>Registered</Text>
  </View>
);

const EventItem = memo(({ item, onPress, apiBase }) => {
  const posterUrl = item.basicInfo.poster.startsWith('http')
    ? item.basicInfo.poster
    : `${apiBase}/${item.basicInfo.poster.replace(/\\/g, "/")}`;

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventImageContainer}>
        <Image source={{ uri: posterUrl }} style={styles.eventImageBlank} />
      </View>
      <View style={styles.eventInfo}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle}>{item.basicInfo.eventName}</Text>
          <RegisteredBadge />
        </View>
        <Text style={styles.eventDept}>{item.basicInfo.dept}</Text>
        <Text style={styles.eventMeta}>Venue: {item.eventDetails.venue}</Text>
        <Text style={styles.eventMeta}>Date: {new Date(item.eventDetails.startDate).toLocaleDateString()}</Text>
        <Text style={styles.eventMeta}>Time: {item.eventDetails.startTime}</Text>
        <TouchableOpacity style={styles.detailsButton} onPress={() => onPress?.(item)}>
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

/* ------------------ Main screen ------------------ */

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState(INITIAL_PROFILE_DATA);
  const [profileImageUri, setProfileImageUri] = useState(INITIAL_IMAGE_URI);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBase = useMemo(() => getBaseUrl(), []);
  const params = useLocalSearchParams();

  const fetchRegisteredEvents = async () => {
    setLoading(true);
    try {
      const studentId = await getStudentId();
      if (!studentId) {
        setLoading(false);
        return;
      }
      const response = await fetch(`${apiBase}/api/students/${studentId}/registered-events`);
      const data = await response.json();
      if (data.success) {
        setRegisteredEvents(data.events);
      } else {
        console.error("Failed to fetch registered events:", data.message);
      }
    } catch (error) {
      console.error('Failed to fetch registered events:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRegisteredEvents();
    }, [])
  );

  const loadProfile = useCallback(async () => {
    try {
      const storedProfile = await AsyncStorage.getItem("userProfile");
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfileData(parsedProfile.data || INITIAL_PROFILE_DATA);
        setProfileImageUri(parsedProfile.imageUri || INITIAL_IMAGE_URI);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async (data, imageUri) => {
    try {
      const profileToSave = JSON.stringify({ data, imageUri });
      await AsyncStorage.setItem("userProfile", profileToSave);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  }, []);

  useEffect(() => {
    if (params?.updatedProfile) {
      try {
        const updatedData = JSON.parse(params.updatedProfile);
        setProfileData(updatedData);
        if (updatedData.imageUri) {
          setProfileImageUri(updatedData.imageUri);
        }
        saveProfile(updatedData, updatedData.imageUri);
      } catch (error) {
        console.error("Error parsing updated profile data:", error);
      }
    }
  }, [params?.updatedProfile, saveProfile]);

  // Handler for image selection (using expo-image-picker structure)
  const handleImageSelect = useCallback(async () => {
    try {
      // Try to require expo-image-picker at runtime so this file works even
      // if the package isn't installed in the repo. If it's unavailable,
      // fall back to the simulated picker (keeps behavior safe).
      let ImagePicker;
      try {
        // eslint-disable-next-line global-require
        ImagePicker = require('expo-image-picker');
      } catch (e) {
        ImagePicker = null;
      }

      if (!ImagePicker) {
        // graceful fallback: simulate a selected image (same as previous behavior)
        Alert.alert(
          'Image Picker Not Available',
          "Install 'expo-image-picker' to pick real images. Simulating selection.",
          [
            {
              text: 'OK (Simulate)',
              onPress: () => {
                const simulatedUri = `https://picsum.photos/86/86?grayscale&_=${Date.now()}`;
                setProfileImageUri(simulatedUri);
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your media library to select an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Handle both new and legacy return shapes
      if (!result) return;
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setProfileImageUri(result.assets[0].uri);
        return;
      }
      if (result.uri) {
        setProfileImageUri(result.uri);
        return;
      }
      // If user cancelled or no asset, do nothing
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Unable to open image picker — using simulated image.');
      const simulatedUri = `https://picsum.photos/86/86?grayscale&_=${Date.now()}`;
      setProfileImageUri(simulatedUri);
    }
  }, []);

  const goBack = () => router.back();
  const onViewAll = () => router.push("/(tabs)/Frontend/Student/register"); 
  const onViewDetails = useCallback((item) => router.push({ pathname: "/(tabs)/Frontend/Student/EventDetailsScreen", params: { eventId: item.basicInfo._id } }), []);

  const onEdit = () => {
    router.push({
      pathname: "/(tabs)/Frontend/Student/edit_profile",
      params: {
        initialData: JSON.stringify({ ...profileData, imageUri: profileImageUri }),
      },
    });
  };

  const renderEvent = useCallback(({ item }) => <EventItem item={item} onPress={onViewDetails} apiBase={apiBase} />, [onViewDetails, apiBase]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={goBack} />
        <ActivityIndicator size="large" color="#6F45F0" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Header onBack={goBack} />
      <FlatList
        data={registeredEvents}
        keyExtractor={(it) => it.basicInfo._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.container}>
              <ProfileStrip
                name={profileData.name}
                roll={profileData.roll}
                profileImageUri={profileImageUri}
                onAvatarPress={handleImageSelect}
                onEdit={onEdit}
              />

              <InfoCard title="Academic Info">
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Department:</Text>
                  <Text style={styles.rowValue}>{profileData.dept}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Year:</Text>
                  <Text style={styles.rowValue}>{profileData.year}</Text>
                </View>
              </InfoCard>

              <InfoCard title="Contact Details">
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Email:</Text>
                  <Text style={styles.rowValue}>{profileData.email}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Phone:</Text>
                  <Text style={styles.rowValue}>{profileData.phone}</Text>
                </View>
              </InfoCard>

              <View style={styles.eventsHeader}>
                <Text style={styles.eventsHeaderTitle}>My Registered Events</Text>
                <TouchableOpacity onPress={onViewAll}>
                  <Text style={styles.eventsViewAll}>View All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        renderItem={renderEvent}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />

      <BottomNavBar />
    </SafeAreaView>
  );
}

/* ------------------ Styles (Added uploadText and updated avatarInner) ------------------ */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F1FB" },
  listContent: { paddingBottom: 140 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#000",
    paddingBottom: 16,
    paddingTop:
      Platform.OS === "android" && typeof StatusBar.currentHeight === "number"
        ? StatusBar.currentHeight + 16
        : 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { height: 2, width: 0 },
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#2B2B2B",
    marginRight: 12,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700", flex: 1 },

  /* main container */
  container: { paddingHorizontal: 16, paddingTop: 12 },

  /* profile strip */
  profileStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D9C9FF",
    borderRadius: 12,
    padding: 14,
    paddingBottom: 54,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: "relative",
  },
  avatarWrap: { marginRight: 12, position: "relative" },
  avatarOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderHead: {
    width: 18,
    height: 18,
    borderRadius: 13,
    backgroundColor: "#fff",
    marginBottom: 6,
  },
  placeholderBody: {
    width: 46,
    height: 20,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    backgroundColor: "#fff",
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
  avatarImage: { width: 86, height: 86, borderRadius: 43 },

  profileText: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: "#111" },
  profileRoll: { marginTop: 4, color: "#222", opacity: 0.75 },

  editButton: {
    backgroundColor: "#6F45F0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    position: "absolute",
    right: 16,
    bottom: 12,
  },
  editButtonText: { color: "#fff", fontWeight: "700" },

  /* info card */
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTitle: { fontWeight: "700", marginBottom: 8, fontSize: 14 },
  infoBody: { paddingLeft: 2 },
  row: { flexDirection: "row", marginBottom: 6 },
  rowLabel: { fontWeight: "700", width: 110 },
  rowValue: { flex: 1, flexWrap: "wrap" },

  /* events header */
  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  eventsHeaderTitle: { fontSize: 16, fontWeight: "700" },
  eventsViewAll: { color: "#6F45F0", fontWeight: "700" },

  /* event card */
  eventCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    padding: 10,
  },

  /* Image container ensures image fits the box and centered */
  eventImageContainer: {
    width: 100,
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  /* Blank placeholder that mimics an image (fits the box) */
  eventImageBlank: {
    width: "92%",
    height: "92%",
    borderRadius: 8,
    backgroundColor: "#efeef5",
  },

  eventInfo: { flex: 1, justifyContent: "center" },
  eventTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eventTitle: { fontSize: 16, fontWeight: "700" },
  eventDept: { marginTop: 6, fontWeight: "600", color: "#333" },
  eventMeta: { fontSize: 12, color: "#666", marginTop: 2 },

  detailsButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    backgroundColor: "#6F45F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailsButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  registeredBadge: { backgroundColor: "#28C76F", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  registeredBadgeText: { color: "#fff", fontWeight: "700", fontSize: 11 },

  itemSeparator: { height: 12 },
});