// profile.jsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useCallback, memo } from "react";
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
} from "react-native";
import BottomNavBar from "../components/navbar";
import Icon from "react-native-vector-icons/MaterialIcons";

// NOTE: You must install 'expo-image-picker' for this feature to work!
// import * as ImagePicker from 'expo-image-picker'; 

const { width } = Dimensions.get("window");

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

const EVENTS = [
  { id: "1", title: "Code Valut", dept: "Department of CS&BS", venue: "MIT Mysore", date: "Sept 19, 2025", time: "11:00 AM", registered: true },
  { id: "2", title: "Yuvan", dept: "Department of CV", venue: "MIT Mysore", date: "Dec 08, 2025", time: "09:00 AM", registered: true },
  { id: "3", title: "Hackathon 2025", dept: "Department of IT", venue: "MIT Mysore", date: "Oct 02, 2025", time: "10:00 AM", registered: true },
];

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

const EventItem = memo(({ item, onPress }) => {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventImageContainer}>
        <View style={styles.eventImageBlank} />
      </View>
      <View style={styles.eventInfo}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          {item.registered ? <RegisteredBadge /> : null}
        </View>
        <Text style={styles.eventDept}>{item.dept}</Text>
        <Text style={styles.eventMeta}>Venue: {item.venue}</Text>
        <Text style={styles.eventMeta}>Date: {item.date}</Text>
        <Text style={styles.eventMeta}>Time: {item.time}</Text>
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
  const params = useLocalSearchParams();

  // Logic to handle update from EditProfileScreen via router.replace params
  React.useEffect(() => {
    if (params?.updatedProfile) {
      try {
        const updatedData = JSON.parse(params.updatedProfile);
        setProfileData(updatedData);
        if (updatedData.imageUri) {
          setProfileImageUri(updatedData.imageUri);
        }
      } catch (error) {
        console.error("Error parsing updated profile data:", error);
      }
    }
  }, [params?.updatedProfile]);

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
  const onViewAll = () => router.push("AllEvents"); 
  const onViewDetails = useCallback((item) => router.push({ pathname: "EventDetails", params: { eventId: item.id } }), []);

  const onEdit = () => {
    router.push({
      pathname: "/(tabs)/Frontend/Student/edit_profile",
      params: {
        initialData: JSON.stringify({ ...profileData, imageUri: profileImageUri }),
      },
    });
  };

  const renderEvent = useCallback(({ item }) => <EventItem item={item} onPress={onViewDetails} />, [onViewDetails]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Header onBack={goBack} />
      <FlatList
        data={EVENTS.filter(e => e.registered)}
        keyExtractor={(it) => it.id}
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