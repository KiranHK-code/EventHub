import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Platform,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getBaseUrl } from './api';
import BottomNavBar from '../components/navbar';

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

  const handleMarkAllCheckedIn = async () => {
    if (!eventId) {
      Alert.alert("Error", "Event ID is missing.");
      return;
    }

    // Confirm before proceeding
    Alert.alert(
      "Mark All Checked In",
      `Are you sure you want to mark all ${registrations.length} students as checked in?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const response = await fetch(`${apiBase}/api/events/${eventId}/checkin-all`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              const data = await response.json();

              if (data.success) {
                // Update all registrations to checked-in status
                setRegistrations(prevRegistrations =>
                  prevRegistrations.map(reg => ({ ...reg, status: 'Checked-In' }))
                );
                Alert.alert("Success", `All ${registrations.length} students have been marked as checked in.`);
              } else {
                Alert.alert("Failed", data.message || "Could not mark all students as checked in.");
              }
            } catch (error) {
              console.error("Mark all checked in error:", error);
              Alert.alert("Error", "An error occurred while trying to mark all students as checked in.");
            }
          }
        }
      ]
    );
  };

  const fetchRegistrations = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const fetchUrl = `${apiBase}/api/events/${eventId}/registrations`;
      console.log("Admin is fetching registrations from:", fetchUrl);
      const response = await fetch(fetchUrl);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status}. Body: ${errorText}`);
      }

      const data = await response.json();
      if (data.success) {
        setEventDetails(data.event);
        setRegistrations(data.registrations || []);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setLoading(false);
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
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.heading}>Event Registrations</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { marginHorizontal: 15, marginTop: 15, marginBottom: 15 }]}>
        <Ionicons name="search" size={18} style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Search by Name or USN"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1 }}
        />
      </View>

      {/* Mark Checked In */}
      <TouchableOpacity style={styles.markBtn} onPress={handleMarkAllCheckedIn}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Mark All Checked In</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
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

        {/* Rows */}
        {loading ? (
          <ActivityIndicator size="large" color="#6A5AE0" style={{ marginTop: 40 }} />
        ) : filteredRegistrations.length > 0 ? (
          filteredRegistrations.map((item) => {
            if (!item.studentId) {
              return null; // Skip rendering if student data is missing
            }
            const isCheckedIn = item.status === 'Checked-In';
            return (
              <View key={item._id} style={styles.row}>
                <Text style={styles.rowText}>{item.studentId.name}</Text>
                <Text style={styles.rowText}>{item.studentId.usn}</Text>
                <Text style={styles.rowText}>{item.studentId.department}</Text>

                {/* STATUS */}
                <View style={isCheckedIn ? styles.checkedInBadge : styles.statusBadge}>
                  <Text style={isCheckedIn ? styles.checkedInText : styles.registeredText}>
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
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFEAFF" },

  headerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#000",
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
  },
  heading: { 
    fontSize: 24, 
    fontWeight: "700", 
    marginLeft: 15,
    color: "#fff",
    flex: 1,
  },

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

  tableHeadText: { color: "#fff", fontSize: 12, width: 70, textAlign: 'center' },

  row: {
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowText: { width: 70, fontSize: 12, textAlign: 'center' },

  statusBadge: {
    backgroundColor: "#E8FDEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  registeredText: {
    color: "#16a34a",
    fontWeight: "600",
    fontSize: 12,
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
  markBtn: {
    backgroundColor: "#6A5AE0",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 0,
    marginBottom: 10,
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
