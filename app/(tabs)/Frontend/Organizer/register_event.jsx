import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Navbar from "../components/navbar";   // <-- your fixed bottom nav
import { useRouter, useLocalSearchParams } from "expo-router";

export default function RegistrationDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params?.eventId;
  const eventType = params?.eventType; // Get eventType from params
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
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
  const [googleFormLink, setGoogleFormLink] = useState(""); // State for the form link

  const [showRegWindow, setShowRegWindow] = useState(false);

  const [selectedDept, setSelectedDept] = useState(null);

  const departments = [
    "CSE", "ECE", "EEE", "CIVIL",
    "MECH", "IS", "AI", "AI & ML","DS","CS&BS","IOT"
  ];

  const goToContact = () => {
    try {
      if (!eventId) {
        Alert.alert("Error", "Event ID not found. Please start from the beginning.");
        return;
      }

      const eventData = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isFreeEvent,
        isAllDept,
        venue,
        participants,
        price,
        selectedDept,
        googleFormLink: (eventType === 'Hackathon' || eventType === 'Workshop') ? googleFormLink : undefined,
      };

      router.push({
        pathname: "/(tabs)/Frontend/Organizer/contact",
        params: { 
          eventId: eventId,
          registrationDraft: JSON.stringify(eventData) 
        },
      });
    } catch (err) {
      Alert.alert("Navigation Error", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.screen}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcon name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabPill, styles.inactiveTab]}
            onPress={() => router.push("/(tabs)/Frontend/Organizer/create_event")}
          >
            <Text style={styles.inactiveTabText}>Basic Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabPill, styles.activeTab]} disabled>
            <Text style={styles.activeTabText}>Registrations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, styles.contactTab]}
            onPress={() => router.push("/(tabs)/Frontend/Organizer/contact")}
          >
            <Text style={styles.contactTabText}>Contact</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>
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

            <View style={[styles.row, { marginTop: 12 }] }>
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
          </View>

          <View style={styles.sectionCard}>
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
            {(eventType === 'Hackathon' || eventType === 'Workshop') && (
              <TextInput
                style={styles.input}
                placeholder="Google Form Link for Registration"
                value={googleFormLink}
                onChangeText={setGoogleFormLink}
                keyboardType="url"
                autoCapitalize="none"
              />
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.rowBetween}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Price"
                value={price}
                editable={!isFreeEvent}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Free Event</Text>
                <Switch value={isFreeEvent} onValueChange={setIsFreeEvent} />
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Registration Window</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable Requirements</Text>
              <Switch value={showRegWindow} onValueChange={setShowRegWindow} />
            </View>

            {showRegWindow && (
              <View style={styles.infoBox}>
                <Text>Student ID</Text>
                <Text>Year of Study</Text>
                <Text>Branch/Department</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Event Audience & Visibility</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>All Departments</Text>
              <Switch
                value={isAllDept}
                onValueChange={(v) => {
                  setIsAllDept(v);
                  if (v) setSelectedDept(null);
                }}
              />
            </View>

            {!isAllDept && (
              <View style={styles.deptBox}>
                {departments.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.deptItem,
                      selectedDept === d && styles.deptSelected,
                    ]}
                    onPress={() => setSelectedDept(d)}
                  >
                    <Text style={styles.deptText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={goToContact}>
            <Text style={styles.nextText}>Next: Event Content</Text>
          </TouchableOpacity>
        </ScrollView>

        {!isKeyboardVisible && <Navbar />}
      </View>
    </KeyboardAvoidingView>
  );
}

// ----------------------------------------------------
//                      STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EFEAFE",
  },
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
    alignItems: "center",
    justifyContent: "center",
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
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { height: 1, width: 0 },
    elevation: 1,
  },
  activeTab: {
    backgroundColor: "#C9B8FF",
  },
  activeTabText: {
    color: "#1E0F49",
    fontWeight: "700",
  },
  inactiveTab: {
    backgroundColor: "#ffffffff",
  },
  inactiveTabText: {
    color: "#000000ff",
    fontWeight: "700",
  },
  contactTab: {
    backgroundColor: "#ffffffff",
  },
  contactTabText: {
    color: "#000000ff",
    fontWeight: "700",
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2E2059",
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
    borderColor: "#E0D8FF",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#F9F7FF",
    marginTop: 10,
  },
  flexInput: {
    flex: 1,
    marginRight: 10,
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
  switchLabel: {
    marginRight: 12,
    fontWeight: "600",
    color: "#4A3C77",
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    backgroundColor: "#F4F0FF",
    borderColor: "#E1D9FF",
    marginTop: 12,
  },
  deptBox: {
    marginTop: 12,
    backgroundColor: "#F9F7FF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1D9FF",
  },
  deptItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DED3FF",
    marginVertical: 5,
    backgroundColor: "#fff",
  },
  deptSelected: {
    backgroundColor: "#DCD0FF",
    borderColor: "#5A35FF",
  },
  deptText: {
    fontSize: 15,
  },
  nextBtn: {
    backgroundColor: "#5A35FF",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 12,
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
