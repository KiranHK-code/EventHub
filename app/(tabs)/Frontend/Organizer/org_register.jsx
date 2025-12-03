import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  if (Platform.OS === 'android') {
    return "http://10.0.2.2:5000";
  }
  // Fallback for other environments or if the above fails
  return "http://192.168.93.107:5000";
};

export default function MyRegistrations() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { eventId } = params;
  const apiBase = useMemo(() => getBaseUrl(), []);

  const [search, setSearch] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const fetchUrl = `${apiBase}/api/events/${eventId}/registrations`;
        console.log("Attempting to fetch registrations from:", fetchUrl); // Add this log
        const response = await fetch(fetchUrl);

        // First, check if the response was successful (e.g., status 200-299)
        if (!response.ok) {
          // If not, read the response as text to see the error (likely HTML)
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status}. Body: ${errorText}`);
        }

        const data = await response.json(); // Now it's safe to parse as JSON
        if (data.success) {
          setEventDetails(data.event);
          setRegistrations(data.registrations || []); // Ensure registrations is an array
        }
      } catch (error) {
        console.error("Failed to fetch registrations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [eventId, apiBase]);

  const handleCheckIn = async (registrationId) => {
    try {
      const response = await fetch(`${apiBase}/api/registrations/${registrationId}/checkin`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success) {
        // Update the status in the local state to give instant feedback
        setRegistrations(prevRegistrations =>
          prevRegistrations.map(reg =>
            reg._id === registrationId ? { ...reg, status: 'Checked-In' } : reg
          )
        );
        Alert.alert("Success", "Student has been checked in.");
      } else {
        Alert.alert("Check-in Failed", data.message || "Could not check in the student.");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      Alert.alert("Error", "An error occurred while trying to check in.");
    }
  };

  const filteredRegistrations = useMemo(() => {
    if (!search) {
      return registrations;
    }
    return registrations.filter(reg =>
      reg.studentId?.name.toLowerCase().includes(search.toLowerCase()) ||
      reg.studentId?.usn.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, registrations]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} />
        </TouchableOpacity>
        <Text style={styles.heading}>My Registrations</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Search by Name or USN"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1 }}
        />
        <TouchableOpacity style={styles.filterChip}>
          <Text style={{ fontSize: 12 }}>All</Text>
        </TouchableOpacity>
      </View>

      {/* Mark Checked In */}
      <TouchableOpacity style={styles.markBtn}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Mark All Checked In</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Event Card */}
        <View style={styles.eventCard}>
          {eventDetails && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.eventTitle}>Event: {eventDetails.eventName}</Text>
              <Text>By {eventDetails.organizerName || 'Organizer'}</Text>
            </View>
          )}

          <Text style={styles.totalReg}>Total Registrations: {registrations.length}/{eventDetails?.eventDetails?.participants || 'N/A'}</Text>
          
          <TouchableOpacity style={styles.exportBtn}>
            <Text style={{ color: "#fff" }}>Export Data</Text>
          </TouchableOpacity>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeadText}>Name</Text>
          <Text style={styles.tableHeadText}>USN</Text>
          <Text style={styles.tableHeadText}>Department</Text>
          <Text style={styles.tableHeadText}>Status</Text>
          <Text style={styles.tableHeadText}>Actions</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6A5AE0" style={{ marginTop: 40 }} />
        ) : filteredRegistrations.length > 0 ? (
          filteredRegistrations.map((item) => {
            // Check if studentId exists and is not null before rendering the row
            if (!item.studentId) {
              return null; // Or render a placeholder for a deleted user
            }
            return (
              <View key={item._id} style={styles.row}>
                <Text style={styles.rowText}>{item.studentId.name}</Text>
                <Text style={styles.rowText}>{item.studentId.usn}</Text>
                <Text style={styles.rowText}>{item.studentId.department}</Text>
  
                <View style={item.status === 'Checked-In' ? styles.checkedInBadge : styles.statusBadge}>
                  <Text style={item.status === 'Checked-In' ? styles.checkedInText : styles.registeredText}>
                    {item.status || 'Registered'}
                  </Text>
                </View>
  
                <TouchableOpacity
                  style={styles.checkBtn}
                  onPress={() => handleCheckIn(item._id)}
                  disabled={item.status === 'Checked-In'}
                >
                  <Text style={{ color: "#5A4FCF", fontWeight: "600" }}>Check In</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No registrations for this event yet.</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFEAFF", padding: 15 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  heading: { fontSize: 22, fontWeight: "700", marginLeft: 10 },

  searchContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  filterChip: {
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 10,
  },

  markBtn: {
    backgroundColor: "#6A5AE0",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 10,
  },

  eventCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  eventTitle: { fontWeight: "700", fontSize: 16 },
  totalReg: { fontSize: 14, fontWeight: "600", marginTop: 5 },

  exportBtn: {
    backgroundColor: "#5945FF",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    width: 120,
    alignItems: "center",
  },

  tableHeader: {
    backgroundColor: "#7C6BF6",
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    justifyContent: "space-between",
  },

  tableHeadText: { color: "#fff", fontSize: 12, width: 70 },

  row: {
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowText: { width: 70, fontSize: 12 },

  statusBadge: {
    backgroundColor: "#E8FDEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  registeredText: {
    color: "#16a34a", 
    fontWeight: "600", 
    fontSize: 12
  },
  checkedInBadge: {
    backgroundColor: "#EBE7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  checkedInText: {
    color: "#5A4FCF",
    fontWeight: "600",
    fontSize: 12
  },

  checkBtn: {
    backgroundColor: "#EBE7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
