import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";

const API_BASE_URL = "http://192.168.93.107:5000";

export default function ContactEventScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState([
    { name: "", phone: "", email: "" },
  ]);
  const [highlights, setHighlights] = useState([
    { text: "" }
  ]);
  const [schedule, setSchedule] = useState([
    { time: "10:00 AM", task: "Coding begins" },
    { time: "01:00 PM", task: "Lunch" },
    { time: "06:00 PM", task: "1st Check Point" },
  ]);
  const [loading, setLoading] = useState(false);

  

  const addContact = () =>
    setContacts([...contacts, { name: "", phone: "", email: "" }]);
  
  const addHighlight = () =>
    setHighlights([...highlights, { text: "" }]);
  
  const addSchedule = () =>
    setSchedule([...schedule, { time: "", task: "" }]);

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
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
    const validContact = contacts.some(c => c.name && c.phone && c.email);
    if (!validContact) {
      Alert.alert("Validation Error", "Please add at least one complete contact");
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

    setLoading(true);
    try {
      // Filter and format data
      const validContacts = contacts.filter(c => c.name && c.phone && c.email);
      const validHighlights = highlights.filter(h => h.text.trim());

      const contactData = {
        name: validContacts[0].name, // Primary contact
        phone: validContacts[0].phone,
        email: validContacts[0].email,
        highlights: validHighlights,
        schedule: schedule,
      };

      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success", "Contact details saved!");
        router.push("/(tabs)/Frontend/Admin/review");
      } else {
        Alert.alert("Error", result.error || "Failed to save contact");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Create Event</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Basic Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Registrations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Section */}
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

        {/* Highlights Section */}
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

          <View style={{ marginTop: 15 }}>
            <Text style={styles.bullet}>• Open to 2nd & 3rd year B-Tech students</Text>
            <Text style={styles.bullet}>• Participate all CSE Stream branches</Text>
            <Text style={styles.bullet}>• Teams of 2–4 members</Text>
            <Text style={styles.bullet}>• Mentorship from industry experts</Text>
          </View>
        </View>

        {/* Schedule Section */}
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

        {/* Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.draftButton} disabled={loading}>
            <Text style={styles.draftText}>Save as Draft</Text>
          </TouchableOpacity>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F6FF" },
  headerRow: {
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    gap: 10,
  },
  headerText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  tab: {
    backgroundColor: "#E8E0FF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: { backgroundColor: "#B19CFF" },
  tabText: { color: "#000", fontWeight: "500" },
  activeTabText: { color: "#fff", fontWeight: "600" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    marginLeft: 20,
  },

  card: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 15,
    borderRadius: 15,
    elevation: 3,
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
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
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

  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
    marginHorizontal: 10,
  },
  draftButton: {
    backgroundColor: "#E8E0FF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  draftText: { color: "#000", fontWeight: "600" },
  submitButton: {
    backgroundColor: "#7B61FF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: { color: "#fff", fontWeight: "600" },
});