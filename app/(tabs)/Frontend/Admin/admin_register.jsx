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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getBaseUrl } from './api';

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
        console.log("Admin is fetching registrations from:", fetchUrl); // Add this log for debugging
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

    fetchRegistrations();
  }, [eventId, apiBase]);

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
        <Text style={styles.heading}>Event Registrations</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Search by Name or USN"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1 }}
        />
      </View>

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
                    {isCheckedIn ? 'Confirmed' : 'Registered'}
                  </Text>
                </View>
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

  tableHeadText: { color: "#fff", fontSize: 12, width: 80, textAlign: 'center' },

  row: {
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowText: { width: 80, fontSize: 12, textAlign: 'center' },

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
