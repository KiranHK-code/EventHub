import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomNavBar from "../components/navbar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// --- Helper functions to get the API URL ---
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

const EventCard = ({ item, apiBase, router }) => {
  const getStatusBadge = () => {
    switch (item.status) {
      case "Approved":
        return <View style={[styles.badge, styles.approvedBadge]}><Text style={styles.badgeText}>Approved</Text></View>;
      case "Pending":
        return <View style={[styles.badge, styles.pendingBadge]}><Text style={styles.badgeText}>Pending</Text></View>;
      case "Rejected":
        return <View style={[styles.badge, styles.rejectedBadge]}><Text style={styles.badgeText}>Rejected</Text></View>;
      default:
        return null;
    }
  };

  const handlePress = () => {
    if (item.status === 'Approved') {
      router.push({ pathname: '(tabs)/Frontend/Organizer/org_register', params: { eventId: item._id } });
    }
    if (item.status === 'Rejected') {
      router.push({ pathname: '(tabs)/Frontend/Organizer/feedback', params: { eventId: item._id } });
    }
  };

  return (
    <View style={styles.eventCard}>
      <Image source={item.image ? { uri: `${item.image.replace(/\\/g, '/')}` } : require('../../../../assets/images/icon.png')} style={styles.eventImage} />
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Date not set'}</Text>
        {getStatusBadge()}
        {item.status === 'Rejected' && item.reason && (
          <Text style={styles.rejectionReason}>Reason: {item.reason}</Text>
        )}
      </View>
      {item.status !== 'Pending' && (
        <TouchableOpacity style={styles.viewDetailsBtn} onPress={handlePress}>
          <Ionicons name="arrow-forward" size={20} color="#5A48FF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function AllEventsScreen() {
  const router = useRouter();
  const apiBase = useMemo(() => getBaseUrl(), []);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const organizerData = await AsyncStorage.getItem('@organizerProfile');
      if (!organizerData) {
        setLoading(false);
        return;
      }
      const { _id: organizerId } = JSON.parse(organizerData);
      const response = await fetch(`${apiBase}/organizer-events?organizerId=${organizerId}`);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to fetch events. Status: ${response.status}. Body: ${errorBody}`);
      }
      const data = await response.json();
      if (data.success) {
        setAllEvents(data.events || []);
      } else {
        console.error("API Error:", data.error);
        setAllEvents([]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllEvents();
    }, [])
  );

  const { approved, pending, rejected } = useMemo(() => {
    return {
      approved: allEvents.filter((e) => e.status === "Approved"),
      pending: allEvents.filter((e) => e.status === "Pending"),
      rejected: allEvents.filter((e) => e.status === "Rejected"),
    };
  }, [allEvents]);


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#5A48FF" />
          <Text style={styles.loaderText}>Loading Events...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Section 1: Your Events (Approved) */}
          <Text style={styles.sectionTitle}>Your Events</Text>
          {approved.length > 0 ? (
            approved.map(item => <EventCard key={item._id} item={item} apiBase={apiBase} router={router} />)
          ) : (
            <Text style={styles.emptyText}>No approved events yet.</Text>
          )}

          {/* Section 2: Pending Events */}
          <Text style={styles.sectionTitle}>Pending Events</Text>
          {pending.length > 0 ? (
            pending.map(item => <EventCard key={item._id} item={item} apiBase={apiBase} router={router} />)
          ) : (
            <Text style={styles.emptyText}>No events are pending approval.</Text>
          )}

          {/* Section 3: Rejected Events */}
          <Text style={styles.sectionTitle}>Rejected Events</Text>
          {rejected.length > 0 ? (
            rejected.map(item => <EventCard key={item._id} item={item} apiBase={apiBase} router={router} />)
          ) : (
            <Text style={styles.emptyText}>You have no rejected events.</Text>
          )}
        </ScrollView>
      )}
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4EEFB" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#000",
    paddingBottom: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 16 : 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    marginRight: 12,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    marginTop: 16,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { height: 4, width: 0 },
    elevation: 3,
  },
  eventImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  eventDetails: { flex: 1, marginLeft: 12 },
  eventTitle: { fontSize: 16, fontWeight: "bold", color: "#111" },
  eventDate: { fontSize: 13, color: "#666", marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  approvedBadge: { backgroundColor: "#28a745" },
  pendingBadge: { backgroundColor: "#ffc107" },
  rejectedBadge: { backgroundColor: "#dc3545" },
  rejectionReason: { fontSize: 12, color: "#dc3545", marginTop: 5, fontStyle: 'italic' },
  viewDetailsBtn: {
    padding: 8,
    backgroundColor: '#EFEAFF',
    borderRadius: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    marginBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});