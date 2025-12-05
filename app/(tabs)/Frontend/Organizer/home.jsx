import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OrganizerNavbar from "../components/navbar";

// --- Helper functions to get the API URL (same as in your other files) ---
const cleanUrl = (value) => {
  if (!value) return null;
  let url = value.trim();
  if (!/^https?:\/\//.test(url)) {
    url = `http://${url}`;
  }
  return url.replace(/\/$/, "");
};

const getBaseUrl = () => {
  // 1. Try to get the base URL from environment variables.
  const envUrl = cleanUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;

  // 2. Fallback to using the host URI from Expo's config.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000`;
  }

  // 3. Final fallback for older setups or edge cases.
  return "http://localhost:5000";
};
// --- End of helper functions ---

export default function HomeScreen() {
  const router = useRouter();
  const apiBase = useMemo(() => getBaseUrl(), []);
  const [events, setEvents] = useState([]);

  // State for the statistics
  const [totalEvents, setTotalEvents] = useState(0);
  const [approvedEvents, setApprovedEvents] = useState(0);
  const [pendingEvents, setPendingEvents] = useState(0);

  const fetchOrganizerEvents = async () => {
    try {
      // Get the logged-in organizer's ID
      const organizerData = await AsyncStorage.getItem('@organizerProfile');
      if (!organizerData) {
        console.log("No organizer logged in.");
        return;
      }
      const { _id: organizerId } = JSON.parse(organizerData);
      const response = await fetch(`${apiBase}/organizer-events?organizerId=${organizerId}`);
      
      // If response is not OK, log more details for debugging
      if (!response.ok) {
        const errorBody = await response.text(); // Get the raw error message from the server
        throw new Error(`Failed to fetch events from server. Status: ${response.status}. Body: ${errorBody}`);
      }
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []); // Ensure events is always an array
      } else {
        console.error("API Error:", data.error);
        setEvents([]); // Reset on error
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setEvents([]); // Reset on error
    }
  };

  // This effect runs every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrganizerEvents();
    }, [])
  );

  // This effect recalculates stats whenever the events list changes
  useEffect(() => {
    setTotalEvents(events.length);
    setApprovedEvents(events.filter(event => event.status === 'Approved').length);
    setPendingEvents(events.filter(event => event.status === 'Pending').length);
  }, [events]);

  return (
    <View style={{ flex: 1, backgroundColor: "#EFEAFF" }}>
      {/* Top Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.headerText}>Hello Organizer!</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { width: "32%" }]}>
            <Ionicons name="file-tray-full-outline" size={24} color="#5A48FF" />
            <Text style={styles.statNumber}>{String(totalEvents).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>

          <View style={[styles.statCard, { width: "32%" }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#28a745" />
            <Text style={styles.statNumber}>{String(approvedEvents).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>

          <View style={[styles.statCard, { width: "32%" }]}>
            <Ionicons name="hourglass-outline" size={24} color="#ffc107" />
            <Text style={styles.statNumber}>{String(pendingEvents).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.title}>Quick Actions</Text>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={()=>{router.push("(tabs)/Frontend/Organizer/create_event")}}>
            <Ionicons name="add-circle-outline" size={22} color="#5A48FF" />
            <Text style={styles.quickText}>Create New Event</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtnSecondary} onPress={() => router.push('(tabs)/Frontend/Organizer/all_events')}>
            <Text style={styles.quickTextWhite}>View All My Event</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Events */}
        <Text style={styles.title}>Your Upcoming Events</Text>

        {events.length > 0 ? (
          events.map((item) => (
            <View key={item._id} style={styles.eventCard}>
              <Image source={item.image ? { uri: `${item.image.replace(/\\/g, '/')}` } : require('../../../../assets/images/icon.png')} style={styles.eventImage} />

              <View style={{ flex: 1, paddingLeft: 10 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDate}>{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Date TBD'}</Text>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                  <View style={
                    item.status === 'Approved'
                      ? styles.approvedBadge
                      : item.status === 'Rejected'
                      ? styles.rejectedBadge
                      : styles.pendingBadge
                  }>
                    <Text style={{ fontSize: 12, color: "#fff" }}>{item.status}</Text>
                  </View>

                  {item.status === 'Approved' && (
                    <TouchableOpacity style={styles.regBtn} onPress={() => router.push({ pathname: '(tabs)/Frontend/Organizer/org_register', params: { eventId: item._id } })}>
                      <Text style={styles.regText}>View Registrations</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>You have no upcoming events.</Text>
        )}

      </ScrollView>

      <OrganizerNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100, // Adds space at the bottom to avoid being hidden by the navbar
  },
  header: {
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    paddingTop: 45,
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    marginLeft: 10,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 15,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    color: "#555",
  },
  viewNowBtn: {
    marginTop: 8,
    paddingVertical: 5,
    backgroundColor: "#5A48FF",
    borderRadius: 6,
    alignItems: "center",
  },
  viewNowText: {
    fontSize: 12,
    color: "#fff",
  },
  title: {
    marginTop: 20,
    marginLeft: 15,
    fontSize: 18,
    fontWeight: "700",
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 10,
  },
  quickBtn: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    borderWidth: 1,
    borderColor: "#5A48FF",
  },
  quickBtnSecondary: {
    backgroundColor: "#5A48FF",
    padding: 12,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },
  quickText: {
    color: "#5A48FF",
    fontWeight: "600",
    paddingLeft: 6,
  },
  quickTextWhite: {
    color: "#fff",
    fontWeight: "600",
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 10,
  },
  eventImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  eventTitle: { fontSize: 18, fontWeight: "700" },
  eventDate: { color: "#777", marginTop: 3 },
  approvedBadge: {
    backgroundColor: "green",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingBadge: {
    backgroundColor: "#ffc107",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rejectedBadge: {
    backgroundColor: "#dc3545", 
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  regBtn: {
    backgroundColor: "#5A48FF",
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
  },
  regText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    marginBottom: 20,
  },
});
