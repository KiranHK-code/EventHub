import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Alert
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/FontAwesome";
import Navbar from "../components/navbar";   // <-- your fixed bottom nav
import { router } from "expo-router";

export default function RegistrationDetailsScreen() {
  // Date & Time states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Pickers
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  // Other states
  const [isFreeEvent, setIsFreeEvent] = useState(true);
  const [isAllDept, setIsAllDept] = useState(true);
  const [venue, setVenue] = useState("");
  const [participants, setParticipants] = useState("");
  const [price, setPrice] = useState("");

  const [showRegWindow, setShowRegWindow] = useState(false);

  const [selectedDept, setSelectedDept] = useState(null);

  const departments = [
    "CSE", "ECE", "EEE", "CIVIL",
    "MECH", "IT", "AIDS", "AI & ML"
  ];

  const saveEvent = async () => {
    try {
      const eventData = {
        startDate,
        endDate,
        startTime,
        endTime,
        isFreeEvent,
        isAllDept,
        venue,
        participants,
        price,
        selectedDept
      };

      const response = await fetch("http://192.168.93.107:5000/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success", "Event Stored in Database!");
        router.push("/(tabs)/Frontend/Organizer/contact");
      } else {
        Alert.alert("Error", "Something went wrong!");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Registration Details</Text>

        {/* 📅 Date Pickers */}
        <Text style={styles.sectionTitle}>Date & Time</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.inputWithIcon}
            onPress={() => setShowStartDate(true)}
          >
            <Text>{startDate.toDateString()}</Text>
            <Icon name="calendar" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inputWithIcon}
            onPress={() => setShowEndDate(true)}
          >
            <Text>{endDate.toDateString()}</Text>
            <Icon name="calendar" size={20} />
          </TouchableOpacity>
        </View>

        {showStartDate && (
          <DateTimePicker
            value={startDate}
            mode="date"
            onChange={(e, d) => {
              setShowStartDate(false);
              if (d) setStartDate(d);
            }}
          />
        )}

        {showEndDate && (
          <DateTimePicker
            value={endDate}
            mode="date"
            onChange={(e, d) => {
              setShowEndDate(false);
              if (d) setEndDate(d);
            }}
          />
        )}

        {/* ⏰ Time Pickers */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.inputWithIcon}
            onPress={() => setShowStartTime(true)}
          >
            <Text>{startTime.toLocaleTimeString()}</Text>
            <Icon name="clock-o" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inputWithIcon}
            onPress={() => setShowEndTime(true)}
          >
            <Text>{endTime.toLocaleTimeString()}</Text>
            <Icon name="clock-o" size={20} />
          </TouchableOpacity>
        </View>

        {showStartTime && (
          <DateTimePicker
            value={startTime}
            mode="time"
            onChange={(e, d) => {
              setShowStartTime(false);
              if (d) setStartTime(d);
            }}
          />
        )}

        {showEndTime && (
          <DateTimePicker
            value={endTime}
            mode="time"
            onChange={(e, d) => {
              setShowEndTime(false);
              if (d) setEndTime(d);
            }}
          />
        )}

        {/* 🏠 Venue */}
        <Text style={styles.sectionTitle}>Venue & Capacity</Text>
        <TextInput
          style={styles.input}
          placeholder="Venue (e.g., Seminar Hall)"
          value={venue}
          onChangeText={setVenue}
        />
        <TextInput
          style={styles.input}
          placeholder="Participants"
          value={participants}
          onChangeText={setParticipants}
          keyboardType="numeric"
        />

        {/* 💰 Price */}
        <View style={styles.rowBetween}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            placeholder="Price"
            value={price}
            editable={!isFreeEvent}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Text>Free Event</Text>
            <Switch value={isFreeEvent} onValueChange={setIsFreeEvent} />
          </View>
        </View>

        {/* 👤 Registration Window */}
        <Text style={styles.sectionTitle}>Registration Window</Text>
        <View style={styles.switchRow}>
          <Text style={{ marginRight: 10 }}>Enable Requirements</Text>
          <Switch value={showRegWindow} onValueChange={setShowRegWindow} />
        </View>

        {showRegWindow && (
          <View style={styles.infoBox}>
            <Text>Student ID</Text>
            <Text>Year of Study</Text>
            <Text>Branch/Department</Text>
          </View>
        )}

        {/* 🏫 Department Section */}
        <Text style={styles.sectionTitle}>Event Audience & Visibility</Text>

        <View style={styles.rowBetween}>
          <View style={styles.switchRow}>
            <Text style={{ marginRight: 10 }}>All Departments</Text>
            <Switch
              value={isAllDept}
              onValueChange={(v) => {
                setIsAllDept(v);
                if (v) setSelectedDept(null);
              }}
            />
          </View>
        </View>

        {!isAllDept && (
          <View style={styles.deptBox}>
            <Text style={styles.sectionTitle}>Select Department</Text>

            {departments.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.deptItem,
                  selectedDept === d && styles.deptSelected
                ]}
                onPress={() => setSelectedDept(d)}
              >
                <Text style={styles.deptText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ➡ Next */}
        <TouchableOpacity style={styles.nextBtn} onPress={saveEvent}>
          <Text style={styles.nextText}>Next: Event Content</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed Navbar */}
      <Navbar />
    </>
  );
}

// ----------------------------------------------------
//                      STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: "#f4efff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    width: "48%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  rowBetween: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    backgroundColor: "#fff",
    borderColor: "#ccc",
  },
  deptBox: {
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  deptItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 5,
    backgroundColor: "#fafafa",
  },
  deptSelected: {
    backgroundColor: "#dcd0ff",
    borderColor: "#5a35ff",
  },
  deptText: {
    fontSize: 15,
  },
  nextBtn: {
    backgroundColor: "#5a35ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },
  nextText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
