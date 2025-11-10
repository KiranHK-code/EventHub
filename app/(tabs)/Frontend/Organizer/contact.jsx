import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";

export default function ContactEventScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState([
    { name: "", phone: "", email: "" },
  ]);
  const [highlights, setHighlights] = useState([]);
  const [schedule, setSchedule] = useState([
    { time: "10:00 AM", task: "Coding begins" },
    { time: "01:00 PM", task: "Lunch" },
    { time: "06:00 PM", task: "1st Check Point" },
  ]);

  const addContact = () =>
    setContacts([...contacts, { name: "", phone: "", email: "" }]);
  const addHighlight = () =>
    setHighlights([...highlights, { text: "e.g. Prize Pool worth ₹50,000" }]);
  const addSchedule = () =>
    setSchedule([...schedule, { time: "", task: "" }]);

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
              <TextInput style={styles.input} placeholder="Name e.g. Priya" />
              <TextInput
                style={styles.input}
                placeholder="Phone e.g. +91 8888888888"
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Email e.g. priya@gmail.com"
                keyboardType="email-address"
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addContact}>
            <Text style={styles.addButtonText}>+ Add Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Highlights Section */}
        <View style={styles.card}>
          <Text style={styles.subHeader}>Highlights & Prize</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="e.g. Prize Pool worth ₹50,000"
            />
            <TouchableOpacity style={styles.smallButton} onPress={addHighlight}>
              <Text style={styles.smallButtonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.bullet}>• Open to 2nd & 3rd year B-Tech students</Text>
            <Text style={styles.bullet}>• Participate all CSE Stream branches</Text>
            <Text style={styles.bullet}>• Teams of 2–4 members</Text>
            <Text style={styles.bullet}>• Mentorship from industry experts</Text>
          </View>
        </View>

        {/* Schedule Section */}
        <View style={styles.card}>
          <Text style={styles.subHeader}>Schedule & Agenda</Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="10:00 AM - Coding begins"
            />
            <TouchableOpacity style={styles.smallButton} onPress={() => {}}>
              <Text style={styles.smallButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>

          {schedule.map((item, i) => (
            <View key={i} style={styles.scheduleItem}>
              <Text style={styles.scheduleTime}>{item.time}</Text>
              <Text style={styles.scheduleTask}>{item.task}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addSchedule}>
            <Text style={styles.addButtonText}>+ Add Schedule Item</Text>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.draftButton}>
            <Text style={styles.draftText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitText}>Submit for Approval</Text>
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
  },
  addButtonText: { color: "#fff", fontWeight: "600" },

  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  smallButton: {
    backgroundColor: "#7B61FF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  smallButtonText: { color: "#fff", fontWeight: "600" },
  bullet: { color: "#333", marginTop: 4 },

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
  submitText: { color: "#fff", fontWeight: "600" },
});
