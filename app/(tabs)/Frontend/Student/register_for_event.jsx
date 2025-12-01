import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function RegisterForEvent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { eventData } = params;

  let event = null;
  try {
    event = eventData ? JSON.parse(eventData) : null;
  } catch (e) {
    console.error("Failed to parse event data:", e);
    // Handle error, maybe navigate back or show an error message
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text>Event data not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleRegister = async () => {
    const url = event.eventDetails?.googleFormLink;

    if (!url) {
      Alert.alert("Registration Not Available", "The registration link for this event is not available yet.");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Invalid Link", `Cannot open this URL: ${url}. Please check the link or try again later.`);
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
      Alert.alert("Error", "Could not open the registration link. Please try again.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    try {
      const date = new Date(dateStr);
      return isNaN(date) ? dateStr : date.toDateString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Confirm Registration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={{ uri: event.basicInfo.poster }}
          style={styles.poster}
          imageStyle={{ borderRadius: 16 }}
        />
        <Text style={styles.title}>{event.basicInfo?.eventName}</Text>
        <Text style={styles.dept}>
          {event.basicInfo?.dept
            ? `Department of ${event.basicInfo.dept}`
            : ""}
        </Text>

        <View style={styles.detailsCard}>
          <DetailRow icon="calendar-today" label="Date" value={formatDate(event.eventDetails?.startDate)} />
          <DetailRow icon="schedule" label="Time" value={event.eventDetails?.startTime || "TBD"} />
          <DetailRow icon="location-on" label="Venue" value={event.eventDetails?.venue || "TBD"} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
          <Text style={styles.registerBtnText}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Icon name={icon} size={20} color="#896af1" style={styles.detailIcon} />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#E9E1FF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { backgroundColor: "#07040F", flexDirection: "row", alignItems: "center", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center", marginRight: 12 },
  topTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 120 },
  poster: { width: "100%", height: 200, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#120E21" },
  dept: { fontSize: 16, color: "#4F4B61", marginTop: 4, marginBottom: 16 },
  detailsCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  detailIcon: { marginRight: 12 },
  detailLabel: { fontSize: 14, fontWeight: "600", color: "#4F4B61", width: 50 },
  detailValue: { fontSize: 14, color: "#120E21", flex: 1 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "#E9E1FF",
    borderTopWidth: 1,
    borderColor: "#D9C9FF",
  },
  registerBtn: {
    backgroundColor: "#5A33FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  registerBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});