import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import BottomNavBar from "../components/navbar";
import Constants from "expo-constants";

const cleanUrl = (value) => {
  if (!value) return null;
  let url = value.trim();
  if (!/^https?:\/\//.test(url)) { url = `http://${url}`; }
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
  if (Platform.OS === 'android') return "http://10.0.2.2:5000";
  if (Platform.OS === 'ios') return "http://localhost:5000";
  return "http://192.168.93.107:5000";
};

export default function DashboardScreen() {
  const router = useRouter();
  const apiBase = useMemo(() => getBaseUrl(), []);
  const [events, setEvents] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchEventsForReview = async () => {
    try {
      const res = await fetch(`${apiBase}/review`);
      const data = await res.json();
      setEvents(data);

      // Calculate stats
      const approved = data.filter(item => item.basicInfo?.status === 'approved').length;
      const pending = data.filter(item => item.basicInfo?.status === 'pending').length;
      setApprovedCount(approved);
      setPendingCount(pending);

    } catch (err) {
      console.error("Failed to fetch events for review:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchEventsForReview();
  }, [apiBase]));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hello Admin!</Text>
        </View>

        {/* Dashboard Title */}
        <View style={styles.dashboardTitleBox}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
        </View>

        {/* Stats Boxes */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#D4FFE4' }]}>
            <Text style={[styles.statNumber, { color: '#006A2E' }]}>{String(approvedCount).padStart(2, '0')}</Text>
            <Text style={[styles.statLabel, { color: '#005224' }]}>Approved Events</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#FFF3D4' }]}>
            <Text style={[styles.statNumber, { color: '#B58300' }]}>{String(pendingCount).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/Frontend/Admin/review')}>
            <Text style={styles.actionText}>Manage Organizers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/Frontend/Admin/review')}>
            <Text style={styles.actionText}>Manage Registrations</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Events */}
        <Text style={styles.sectionTitle}>New Events for Approval</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#7B57F3" style={{ marginTop: 20 }} />
        ) : (
          events.filter(item => item.basicInfo?.status === 'pending').map((item) => (
            <View key={item.basicInfo._id} style={styles.eventCard}>
              {item.basicInfo.poster && (
                <Image 
                  source={{ uri: item.basicInfo.poster }} 
                  style={styles.eventImg} 
                />
              )}

              <View style={{ flex: 1, marginLeft: item.basicInfo.poster ? 10 : 0 }}>
                <Text style={styles.eventTitle}>New Event: “{item.basicInfo.eventName}”</Text>
                <Text style={styles.eventBy}>Dept: {item.basicInfo.dept}</Text>
                <Text style={styles.eventDate}>
                  Date: {item.eventDetails?.startDate ? new Date(item.eventDetails.startDate).toLocaleDateString() : 'TBD'}
                </Text>

                <View style={styles.pendingTag}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/(tabs)/Frontend/Admin/review1?id=${item.basicInfo._id}`)}>
                <Text style={styles.viewBtnText}>Review Now</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDE6FA",
  },

  header: {
    padding: 20,
    padding: 24,
    backgroundColor: "#000",
  },
  headerTitle: {
    fontSize: 22,
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },

  dashboardTitleBox: {
    backgroundColor: "#7B57F3",
    marginHorizontal: 20,
    padding: 12,
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  dashboardTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 20,
  },

  statBox: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    elevation: 2,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: "#555",
    marginTop: 5,
  },
  subInfo: {
    fontSize: 10,
    color: "gray",
    marginTop: 4,
  },

  sectionTitle: {
    marginTop: 25,
    marginLeft: 20,
    fontWeight: "700",
    fontSize: 16,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },

  actionBtn: {
    backgroundColor: "#7B57F3",
    padding: 15,
    borderRadius: 10,
    width: "45%",
  },
  actionText: {
    textAlign: "center",
    color: "white",
    fontWeight: "600",
  },

  eventCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    elevation: 3,
  },

  eventImg: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },

  eventTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  eventBy: {
    color: "#555",
    fontSize: 12,
  },
  eventDate: {
    color: "#666",
    fontSize: 11,
    marginTop: 3,
  },

  pendingTag: {
    marginTop: 6,
    backgroundColor: "#FFC107",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  pendingText: {
    color: "#5C4800",
    fontSize: 10,
    textAlign: "center",
  },

  viewBtn: {
    backgroundColor: "#7B57F3",
    height: 32,
    alignSelf: 'flex-end',
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  viewBtnText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});
