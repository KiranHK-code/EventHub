import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import BottomNavBar from "../components/navbar";
import Constants from "expo-constants";

const cleanUrl = (value) => {
  if (!value) return null;
  let url = value.trim();
  if (!/^https?:\/\//.test(url)) {
    url = `http://${url}`;
  }
  return url.replace(/\/$/, "");
};

const guessExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.hostUri;

  if (!hostUri) return null;
  const host = hostUri.split(":")[0];
  if (!host) return null;
  return `http://${host}:5000`;
};

const getBaseUrl = () => {
  const envUrl = cleanUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;

  const expoHostUrl = guessExpoHost();
  if (expoHostUrl) return expoHostUrl;

  if (Platform.OS === "android") return "http://10.0.2.2:5000";
  if (Platform.OS === "ios") return "http://127.0.0.1:5000";
  return "http://192.168.93.107:5000";
};

export default function CreateEventScreen() {
  const router = useRouter();
  const apiBase = useMemo(() => getBaseUrl(), []);

  const [eventName, setEventName] = useState("");
  const [dept, setDept] = useState("");
  const [eventType, setEventType] = useState("Hackathon");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const eventTypes = ["Hackathon", "Workshop", "Cultural", "Circulars"];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image pick error', err);
      Alert.alert('Image Error', 'Unable to pick image');
    }
  };

  const submitBasicInfo = async () => {
    if (!eventName || !dept || !description) {
      return Alert.alert("Please fill all fields");
    }

    try {
      let posterUrl = "";

      // If an image is selected, upload it first
      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const formData = new FormData();
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });

        console.log('Uploading image to', apiBase + '/upload-poster');
        const uploadResp = await fetch(apiBase + '/upload-poster', {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        if (!uploadResp.ok) {
          throw new Error(`Upload failed (${uploadResp.status})`);
        }

        const uploadJson = await uploadResp.json();
        if (!uploadJson.success) {
          return Alert.alert('Upload Error', uploadJson.error || 'Failed to upload image');
        }
        posterUrl = uploadJson.url;
      }

      console.log('Sending basic info to', apiBase + '/addBasicInfo');
      const res = await fetch(apiBase + '/addBasicInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          dept,
          eventType,
          image: posterUrl, // server maps `image` -> poster url
          description,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Pass eventId to register_event screen
        router.push({
          pathname: '/(tabs)/Frontend/Organizer/register_event',
          params: { eventId: data.eventId }
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to save event');
      }
    } catch (err) {
      console.error('Event creation failed', err);
      Alert.alert('Network Error', `Unable to reach ${apiBase}.\n${err.message}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tabPill, styles.activeTab]} disabled>
            <Text style={styles.activeTabText}>Basic Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, styles.inactiveTab]}
            onPress={() => router.push('/(tabs)/Frontend/Organizer/register_event')}
          >
            <Text style={styles.inactiveTabText}>Registrations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, styles.inactiveTab]}
            onPress={() => router.push('/(tabs)/Frontend/Organizer/contact')}
          >
            <Text style={styles.inactiveTabText}>Contact</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Basic Info</Text>

            {/* Event Name */}
            <Text style={styles.label}>Event Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Code Vault"
              placeholderTextColor="#999"
              value={eventName}
              onChangeText={setEventName}
            />

            {/* Department */}
            <Text style={styles.label}>Department</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CS&BS"
              placeholderTextColor="#999"
              value={dept}
              onChangeText={setDept}
            />

            {/* Event Type */}
            <Text style={styles.label}>Event Type</Text>
            <View style={styles.eventTypeRow}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.eventTypePill,
                    eventType === type && styles.eventTypeActive,
                  ]}
                  onPress={() => setEventType(type)}
                >
                  <Text
                    style={[
                      styles.eventTypeText,
                      eventType === type && styles.eventTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Poster Upload Box */}
            <View style={styles.posterCard}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.posterImg}
                  resizeMode="cover"
                />
              ) : (
                <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                  <Icon name="add" size={32} color="#555" />
                  <Text style={styles.uploadText}>Upload Image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Write event description..."
              placeholderTextColor="#aaa"
              multiline
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={submitBasicInfo}>
            <Text style={styles.nextButtonText}>Next: Registration Details</Text>
          </TouchableOpacity>
        </ScrollView>
        {!isKeyboardVisible && <BottomNavBar />}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFEAFE",
  },

  /* Top header */
  topHeader: {
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
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 12,
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#EFEAFE",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { height: 1, width: 0 },
  },
  tabPill: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 22,
    alignItems: "center",
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: "#C9B8FF",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "700",
  },
  inactiveTab: {
    backgroundColor: "#fff",
  },
  inactiveTabText: {
    color: "#666",
    fontWeight: "600",
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
    paddingTop: 12,
  },

  /* Form Card */
  formCard: {
    backgroundColor: "#EFEAFE",
    padding: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
  },

  /* Event Type */
  eventTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
  },
  eventTypePill: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  eventTypeActive: {
    backgroundColor: "#8359FF",
  },
  eventTypeText: { color: "#333" },
  eventTypeTextActive: { color: "#fff", fontWeight: "700" },

  /* Poster */
  posterCard: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
  },
  posterImg: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: "#ddd",
  },
  uploadBox: {
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 12,
    borderStyle: "dashed",
  },
  uploadText: {
    marginTop: 6,
    color: "#444",
  },

  /* Description */
  descriptionInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    height: 120,
    fontSize: 14,
  },

  /* Next Button */
  nextButton: {
    backgroundColor: "#6B3EFF",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
