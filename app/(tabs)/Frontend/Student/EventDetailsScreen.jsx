import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Image, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
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
  const envUrl = cleanUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000`;
  }
  return "http://localhost:5000";
};

// This component displays event details for a student.
export default function EventDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { eventId } = params;
  const apiBase = useMemo(() => getBaseUrl(), []);
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/event-details/${eventId}`);
        const data = await response.json();
        if (data.success) {
          setEvent(data.event);
        }
      } catch (error) {
        console.error("Failed to fetch event details:", error);
        Alert.alert("Error", "Could not load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, apiBase]);

  // Function to handle the registration button press
  const handleRegister = async (url) => {
    if (!url) {
      Alert.alert("Registration Not Available", "The registration link for this event is not available yet.");
      return;
    }
  
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Invalid Link", `Cannot open this URL. Please check the link or try again later.`);
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
      Alert.alert("Error", "Could not open the registration link. Please try again.");
    }
  };

  const basicInfo = event?.basicInfo || {};
  const eventDetails = event?.eventDetails || {};

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6B3EFF" />
        <Text style={styles.loaderText}>Loading Event...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
      </View>

      {!loading && event && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {basicInfo.poster && <Image source={{ uri: basicInfo.poster }} style={styles.poster} />}
          <Text style={styles.title}>{basicInfo.eventName || 'Event Name'}</Text>
          <Text style={styles.department}>{basicInfo.dept || 'Department'}</Text>
          <Text style={styles.description}>{basicInfo.description || 'No description available.'}</Text>
          
          {/* Display other event details here, e.g., date, time, venue, etc. */}
          {eventDetails.venue && <Text style={styles.detailText}>Venue: {eventDetails.venue}</Text>}
          {eventDetails.startDate && <Text style={styles.detailText}>Date: {new Date(eventDetails.startDate).toLocaleDateString()}</Text>}
          {eventDetails.startTime && <Text style={styles.detailText}>Time: {new Date(eventDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
          {eventDetails.price && <Text style={styles.detailText}>Price: {eventDetails.isFreeEvent ? 'Free' : `₹${eventDetails.price}`}</Text>}

          {/* The "Register" button will only appear if a googleFormLink is present */}
          {eventDetails.googleFormLink && (
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={() => handleRegister(eventDetails.googleFormLink)}
            >
              <Text style={styles.registerButtonText}>Register Now</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEAFE',
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#000",
    paddingBottom: 16,
    paddingTop: Platform.OS === "android" && typeof StatusBar.currentHeight === "number" ? StatusBar.currentHeight + 16 : 24,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 16, justifyContent: "center", alignItems: "center",
    backgroundColor: "#1F1F1F", borderWidth: 1, borderColor: "#2B2B2B",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginLeft: 12 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  poster: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, backgroundColor: '#ddd' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: '#2E2059' },
  department: { fontSize: 16, color: '#5A35FF', marginBottom: 12 },
  description: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 20 },
  detailText: { fontSize: 14, color: '#666', marginBottom: 5 },
  registerButton: {
    backgroundColor: '#6B3EFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEAFE',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});