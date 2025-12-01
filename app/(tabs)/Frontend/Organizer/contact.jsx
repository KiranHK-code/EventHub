import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import BottomNavBar from "../components/navbar";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";


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

export default function ContactEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params?.eventId;
  const registrationDraft = params?.registrationDraft ? JSON.parse(params.registrationDraft) : null;
  const apiBase = useMemo(() => getBaseUrl(), []);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [contacts, setContacts] = useState([
    { name: "", phone: "", email: "" },
  ]);
  const [highlights, setHighlights] = useState([{ text: "" }]);
  const [schedule, setSchedule] = useState([
    { time: "", task: "" },
    
  ]);
  const [loading, setLoading] = useState(false);

  

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const addContact = () =>
    setContacts([...contacts, { name: "", phone: "", email: "" }]);
  
  const addHighlight = () =>
    setHighlights([...highlights, { text: "" }]);
  
  const addSchedule = () =>
    setSchedule([...schedule, { time: "", task: "" }]);

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    if (field === "phone") {
      const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 10);
      updated[index][field] = digitsOnly;
    } else if (field === "email") {
      updated[index][field] = value.replace(/\s+/g, "").toLowerCase();
    } else {
      updated[index][field] = value;
    }
    setContacts(updated);
  };

  const updateHighlight = (index, value) => {
    const updated = [...highlights];
    updated[index].text = value;
    setHighlights(updated);
  };

  const updateSchedule = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const removeContact = (index) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const removeHighlight = (index) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const removeSchedule = (index) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const validateInputs = () => {
    // Validate at least one contact with all fields
    const validContact = contacts.some((c) => c.name && c.phone && c.email);
    if (!validContact) {
      Alert.alert("Validation Error", "Please add at least one complete contact");
      return false;
    }

    const invalidPhone = contacts.some((c) => c.phone && c.phone.length !== 10);
    if (invalidPhone) {
      Alert.alert("Validation Error", "Phone number must be exactly 10 digits");
      return false;
    }

    const invalidEmail = contacts.some(
      (c) => c.email && !c.email.endsWith("@gmail.com")
    );
    if (invalidEmail) {
      Alert.alert("Validation Error", "Email must end with @gmail.com");
      return false;
    }

    // Validate highlights
    const validHighlights = highlights.filter(h => h.text.trim());
    if (validHighlights.length === 0) {
      Alert.alert("Validation Error", "Please add at least one highlight");
      return false;
    }

    // Validate schedule
    if (schedule.length === 0) {
      Alert.alert("Validation Error", "Please add at least one schedule item");
      return false;
    }

    return true;
  };

  const saveContact = async () => {

    if (!validateInputs()) return;

    if (!eventId) {
      Alert.alert("Error", "Event ID not found. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      // Get the organizer ID from storage, as it's needed for the update.
      const organizerData = await AsyncStorage.getItem('@organizerProfile');
      if (!organizerData) {
        throw new Error("You must be logged in to save event details.");
      }
      const { _id: organizerId } = JSON.parse(organizerData);

      // First, save registration details if they exist
      if (registrationDraft) {
        const registrationData = {
          eventId: eventId,
          organizerId: organizerId, // Add organizerId to the registration data
          ...registrationDraft
        };

        console.log("📝 Saving registration with data:", registrationData);
        const regResponse = await fetch(`${apiBase}/create-event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registrationData),
        });

        const regResult = await regResponse.json();
        console.log("✅ Registration response:", regResult);
        if (!regResult.success) {
          console.log("❌ Registration failed:", regResult.error);
          Alert.alert("Error", regResult.error || "Failed to save registration");
          setLoading(false);
          return;
        }
      }

      // Then save contact details
      const validContacts = contacts.filter(c => c.name && c.phone && c.email);
      const validHighlights = highlights.filter(h => h.text.trim());

      const contactData = {
        eventId: eventId, // Add eventId
        organizerId: organizerId, // Also add organizerId here for consistency
        name: validContacts[0].name, // Primary contact
        phone: validContacts[0].phone,
        email: validContacts[0].email,
        highlights: validHighlights,
        schedule: schedule,
      };

      console.log("📝 Saving contact with data:", contactData);
      const response = await fetch(`${apiBase}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();
      console.log("✅ Contact response:", result);

      if (result.success) {
        console.log("✅ Event submitted for approval");
        Alert.alert("Success", "Event submitted for approval!");
      } else {
        console.log("❌ Contact save failed:", result.error);
        Alert.alert("Error", result.error || "Failed to save contact");
      }
    } catch (err) {
      console.error("❌ Save error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcon name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabPill, styles.inactiveTab]}
            onPress={() => router.push("/(tabs)/Frontend/Organizer/create_event")}
          >
            <Text style={styles.inactiveTabText}>Basic Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, styles.inactiveTab]}
            onPress={() => router.push("/(tabs)/Frontend/Organizer/register_event")}
          >
            <Text style={styles.inactiveTabText}>Registrations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabPill, styles.activeTab]} disabled>
            <Text style={styles.activeTabText}>Contact</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Event Content & Contacts</Text>
          <View style={styles.card}>
          <Text style={styles.subHeader}>Contact Person</Text>

          {contacts.map((c, i) => (
            <View key={i} style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Name e.g. Priya"
                value={c.name}
                onChangeText={(val) => updateContact(i, "name", val)}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone e.g. +91 8888888888"
                keyboardType="phone-pad"
                value={c.phone}
                onChangeText={(val) => updateContact(i, "phone", val)}
                maxLength={10}
              />
              <TextInput
                style={styles.input}
                placeholder="Email e.g. priya@gmail.com"
                keyboardType="email-address"
                value={c.email}
                onChangeText={(val) => updateContact(i, "email", val)}
              />
              {contacts.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeContact(i)}
                >
                  <Icon name="trash" size={16} color="#fff" />
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addContact}>
            <Text style={styles.addButtonText}>+ Add Contact</Text>
          </TouchableOpacity>
        </View>

          <View style={styles.card}>
            <Text style={styles.subHeader}>Highlights & Prize</Text>

            {highlights.map((h, i) => (
            <View key={i} style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. Prize Pool worth ₹50,000"
                value={h.text}
                onChangeText={(val) => updateHighlight(i, val)}
              />
              {highlights.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteSmallButton}
                  onPress={() => removeHighlight(i)}
                >
                  <Icon name="trash" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addHighlight}>
            <Text style={styles.addButtonText}>+ Add Highlight</Text>
          </TouchableOpacity>

            {highlights.some((h) => h.text.trim().length > 0) && (
              <View style={styles.highlightPreview}>
                {highlights
                  .filter((h) => h.text.trim().length > 0)
                  .map((h, idx) => (
                    <Text key={`${idx}-${h.text}`} style={styles.bullet}>
                      {`• ${h.text.trim()}`}
                    </Text>
                  ))}
              </View>
            )}
        </View>

          <View style={styles.card}>
          <Text style={styles.subHeader}>Schedule & Agenda</Text>

          {schedule.map((item, i) => (
            <View key={i} style={styles.scheduleInputRow}>
              <TextInput
                style={[styles.input, { flex: 0.4 }]}
                placeholder="Time"
                value={item.time}
                onChangeText={(val) => updateSchedule(i, "time", val)}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                placeholder="Task"
                value={item.task}
                onChangeText={(val) => updateSchedule(i, "task", val)}
              />
              {schedule.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteSmallButton}
                  onPress={() => removeSchedule(i)}
                >
                  <Icon name="trash" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addSchedule}>
            <Text style={styles.addButtonText}>+ Add Schedule Item</Text>
          </TouchableOpacity>
        </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={saveContact}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit for Approval</Text>
            )}
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
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#000",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { height: 2, width: 0 },
    paddingBottom: 16,
    paddingTop:
      Platform.OS === "android" && typeof StatusBar.currentHeight === "number"
        ? StatusBar.currentHeight + 16
        : 24,
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
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#EFEAFE",
  },
  tabPill: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 999,
    alignItems: "center",
    paddingVertical: 12,
  },
  activeTab: {
    backgroundColor: "#A98BFF",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "700",
  },
  inactiveTab: {
    backgroundColor: "#fff",
  },
  inactiveTabText: {
    color: "#1F1741",
    fontWeight: "700",
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#2E2059",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { height: 4, width: 0 },
    elevation: 2,
  },
  subHeader: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  inputGroup: { marginBottom: 10 },
  input: {
    backgroundColor: "#F2F1FF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },

  addButton: {
    backgroundColor: "#7B61FF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "600" },

  deleteButton: {
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  deleteButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  deleteSmallButton: {
    backgroundColor: "#FF6B6B",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  smallButton: {
    backgroundColor: "#7B61FF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  smallButtonText: { color: "#fff", fontWeight: "600" },
  bullet: { color: "#333", marginTop: 4 },

  scheduleInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  scheduleItem: {
    flexDirection: "row",
    backgroundColor: "#F1ECFF",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    justifyContent: "space-between",
  },
  scheduleTime: { fontWeight: "700", color: "#000" },
  scheduleTask: { color: "#333" },
  highlightPreview: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  submitButton: {
    backgroundColor: "#7B61FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: { color: "#fff", fontWeight: "600" },
});