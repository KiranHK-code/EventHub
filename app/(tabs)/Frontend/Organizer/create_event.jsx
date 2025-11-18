import React, { useState } from "react";
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
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import BottomNavBar from "../components/navbar";

export default function CreateEventScreen() {
  const router = useRouter();

  const [eventName, setEventName] = useState("");
  const [dept, setDept] = useState("");
  const [eventType, setEventType] = useState("Hackathon");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null);

  const eventTypes = ["Hackathon", "Workshop", "Cultural", "Seminar"];

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

        const uploadResp = await fetch('http://192.168.93.107:5000/upload-poster', {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        const uploadJson = await uploadResp.json();
        if (!uploadJson.success) {
          return Alert.alert('Upload Error', uploadJson.error || 'Failed to upload image');
        }
        posterUrl = uploadJson.url;
      }

      const res = await fetch('http://192.168.93.107:5000/addBasicInfo', {
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
        router.push('/(tabs)/Frontend/Organizer/register_event');
      } else {
        Alert.alert('Error', data.error || 'Failed to save event');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* HEADER */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Event</Text>
          </View>

          {/* TOP TABS */}
          <View style={styles.tabsContainer}>
            <View style={styles.activeTab}>
              <Text style={styles.activeTabText}>Basic Info</Text>
            </View>
            <View style={styles.inactiveTab}>
              <Text style={styles.inactiveTabText}>Registrations</Text>
            </View>
            <View style={styles.inactiveTab}>
              <Text style={styles.inactiveTabText}>Contact</Text>
            </View>
          </View>

          {/* FORM CARD */}
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
                <Image source={{ uri: imageUri }} style={styles.posterImg} />
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

        <BottomNavBar />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "#000",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 10,
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#EFEAFE",
  },
  activeTab: {
    backgroundColor: "#C9B8FF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTabText: {
    color: "#000",
    fontWeight: "600",
  },
  inactiveTab: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inactiveTabText: {
    color: "#666",
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
    height: 180,
    borderRadius: 10,
  },
  uploadBox: {
    height: 180,
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
