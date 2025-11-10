import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";

export default function CreateEventScreen() {
  const router = useRouter();
  const [eventType, setEventType] = useState("Hackathon");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null);

  // Function to pick image from gallery
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.header}>Create Event</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>Basic Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Registrations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <Text style={styles.subHeader}>Basic Info</Text>

        <Text style={styles.label}>Event Name</Text>
        <TextInput style={styles.input} placeholder="e.g. Code Vault" />

        <Text style={styles.label}>Department</Text>
        <TextInput style={styles.input} placeholder="e.g. CS&BS" />

        <Text style={styles.label}>Event Type</Text>
        <View style={styles.eventTypeContainer}>
          {["Hackathon", "Workshop", "Cultural", "Seminar"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.eventTypeButton,
                eventType === type && styles.selectedType,
              ]}
              onPress={() => setEventType(type)}
            >
              <Text
                style={[
                  styles.eventTypeText,
                  eventType === type && styles.selectedTypeText,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image Upload Section */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Event Poster</Text>

          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {imageUri ? (
              <View style={styles.imageBlock}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.poster}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Icon name="plus" size={30} color="#7B61FF" />
                <Text style={styles.uploadText}>Upload Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.posterDate}>Date: Dec 10, 2025</Text>
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.descriptionInput}
          multiline
          placeholder="Write about your event..."
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        {/* Next Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() =>
            router.push("/(tabs)/Frontend/Organizer/register_event")
          }
        >
          <Text style={styles.nextButtonText}>Next: Registration Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4EFFF" },

  header: {
    fontSize: 22,
    fontWeight: "700",
    padding: 20,
    color: "#000",
  },

  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 10,
  },
  tab: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
  },
  activeTab: { backgroundColor: "#D9C8FF" },
  tabText: { color: "#000" },
  activeTabText: { color: "#000", fontWeight: "600" },

  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
    marginLeft: 20,
  },
  label: {
    marginHorizontal: 20,
    marginTop: 10,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 5,
    elevation: 2,
  },

  eventTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 20,
    marginTop: 10,
  },
  eventTypeButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    elevation: 2,
  },
  selectedType: { backgroundColor: "#BDA3FF" },
  eventTypeText: { color: "#000" },
  selectedTypeText: { color: "#fff", fontWeight: "600" },

  // Image Upload
  imageSection: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  uploadBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 8,
    elevation: 3,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imageBlock: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },
  poster: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  uploadPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    color: "#7B61FF",
    fontWeight: "600",
    marginTop: 5,
  },
  posterDate: {
    marginTop: 6,
    color: "#555",
    fontSize: 13,
    marginLeft: 5,
  },

  // Description Box
  descriptionInput: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 12,
    borderRadius: 8,
    height: 150,
    elevation: 2,
  },

  // Button
  nextButton: {
    backgroundColor: "#7B61FF",
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 50,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
