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
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
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
  return "http://192.168.93.107:5000"; // Fallback
};
// --- End of helper functions ---

const getNotificationIcon = (type) => {
  switch (type) {
    case "approval":
    case "Approved":
      return { name: "check-circle", color: "#28a745" };
    case "rejection":
    case "Rejected":
      return { name: "highlight-off", color: "#dc3545" };
    default:
      return { name: "notifications", color: "#6f52ff" };
  }
};

export default function OrganizerAlertScreen() {
  const router = useRouter();
  const apiBase = useMemo(() => getBaseUrl(), []);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const organizerData = await AsyncStorage.getItem('@organizerProfile');
      if (!organizerData) {
        setLoading(false);
        return;
      }
      const { _id: organizerId } = JSON.parse(organizerData);
      // Assuming an endpoint like this exists. You may need to create it.
      const response = await fetch(`${apiBase}/organizer-notifications?organizerId=${organizerId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications. Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Fetch Notifications Error:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch notifications every time the screen is focused
  useFocusEffect(useCallback(() => { fetchNotifications(); }, []));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6f52ff" />
          <Text style={styles.loaderText}>Loading Notifications...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {notifications.length > 0 ? (
            notifications.map((item) => {
              const icon = getNotificationIcon(item.type);
              return (
                <View key={item._id} style={styles.notificationCard}>
                  <Icon name={icon.name} size={28} color={icon.color} style={styles.icon} />
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.loaderContainer}>
              <Text style={styles.loaderText}>No notifications yet.</Text>
              </View>
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
    marginRight: 12,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { height: 4, width: 0 },
    elevation: 3,
  },
  icon: {
    marginRight: 16,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    textAlign: "right",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Offset for navbar
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});