import { router, useRouter } from "expo-router";
import BottomNavBar from '../components/navbar';
import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, ImageBackground, StyleSheet, TouchableOpacity, Alert, Dimensions, Modal, TextInput, Platform } from "react-native";
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

export default function Review() {
  const [combinedData, setCombinedData] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // pending or approved
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectEventId, setRejectEventId] = useState(null);
  const apiBase = useMemo(() => getBaseUrl(), []);

  useEffect(() => {
    fetchData();
  }, [apiBase]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${apiBase}/review`);
      const json = await res.json();
      setCombinedData(json);
    } catch (err) {
      console.log("❌ fetchData error:", err);
    }
  };

  const handleApprove = async (eventId, index) => {
    try {
      const res = await fetch(`${apiBase}/review/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      });
      const result = await res.json();
      if (result.success) {
        Alert.alert("Success", "Event approved!");
        fetchData(); // Refresh data
      } else {
        Alert.alert("Error", result.error || "Failed to approve");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleReject = (eventId, index) => {
    setRejectEventId(eventId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const sendRejectionEmail = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Error", "Please enter a rejection reason");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/review/${rejectEventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectionReason: rejectReason })
      });
      const result = await res.json();
      if (result.success) {
        Alert.alert("Success", "Event rejected and email sent!");
        setShowRejectModal(false);
        setRejectReason("");
        setRejectEventId(null);
        fetchData(); // Refresh data
      } else {
        Alert.alert("Error", result.error || "Failed to reject");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const cancelReject = () => {
    setShowRejectModal(false);
    setRejectReason("");
    setRejectEventId(null);
  };

  const handleReview = (eventId, index) => {
    router.push(`/(tabs)/Frontend/Admin/review1?id=${eventId}`);
  };

  // Filter events by status
  const filteredEvents = combinedData.filter(item => 
    (activeTab === "pending" && item.basicInfo?.status !== "approved" && item.basicInfo?.status !== "rejected") ||
    (activeTab === "approved" && item.basicInfo?.status === "approved")
  );

  return (
    <View style={styles.container}>
      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>
            Pending Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "approved" && styles.activeTab]}
          onPress={() => setActiveTab("approved")}
        >
          <Text style={[styles.tabText, activeTab === "approved" && styles.activeTabText]}>
            Approved Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView style={styles.scrollContainer}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.headerRow}>
                {item.basicInfo?.poster ? (
                  <ImageBackground source={{ uri: item.basicInfo.poster }} style={styles.poster} imageStyle={{ borderRadius: 12 }} />
                ) : null}
                <View style={styles.headerText}>
                  <Text style={styles.eventTitle}>{item.basicInfo?.eventName}</Text>
                  <Text style={styles.subtitleText}>{[item.basicInfo?.eventType, item.eventDetails?.startDate ? new Date(item.eventDetails.startDate).toLocaleDateString() : null, item.eventDetails?.venue].filter(Boolean).join(' • ')}</Text>
                  {item.basicInfo?.submittedBy ? <Text style={styles.submittedText}>Submitted by {item.basicInfo.submittedBy}</Text> : null}
                </View>
              </View>

              {activeTab === "pending" && (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.approveBtn]}
                    onPress={() => handleApprove(item.basicInfo._id, index)}
                  >
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectBtn]}
                    onPress={() => handleReject(item.basicInfo._id, index)}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.reviewBtn]}
                    onPress={() => handleReview(item.basicInfo._id, index)}
                  >
                    <Text style={styles.buttonText}>Review</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeTab === "pending" ? "pending" : "approved"} events
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rejection Reason Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={cancelReject}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejection Reason</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for rejecting this event:</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Type your rejection reason here..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={cancelReject}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSendBtn} onPress={sendRejectionEmail}>
                <Text style={styles.modalButtonText}>Send Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <BottomNavBar />
      </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFEAFE", paddingTop: 24 },

  // Tabs (same as screenshot)
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#EFEAFE",
    padding: 10,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  activeTab: { backgroundColor: "#8359FF" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#555" },
  activeTabText: { color: "#fff" },

  scrollContainer: { padding: 12, paddingTop: 12 },

  // Card styling exactly like screenshot
  card: {
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },

  // Poster left side
  poster: {
    width: 74,
    height: 74,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 8,
    alignSelf: "center",
  },

  // Right content
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  subtitleText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    paddingLeft: 8,
  },

  submittedText: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  createdByText: {
    fontSize: 13,
    color: "#555",
    marginVertical: 4,
  },

  // Status badge like screenshot
  statusBadge: {
    backgroundColor: "#FFD966",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginLeft: "auto",
  },
  statusText: {
    fontSize: 11,
    color: "#A67C00",
    fontWeight: "700",
  },

  // Buttons bottom row
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  approveBtn: { backgroundColor: "#4CAF50" },
  rejectBtn: { backgroundColor: "#F44336" },
  reviewBtn: { backgroundColor: "#E6E6E6" },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  reviewBtnText: {
    color: "#000",
    fontWeight: "700",
  },

  // Empty text
  emptyContainer: { alignItems: "center", paddingTop: 50 },
  emptyText: { fontSize: 16, color: "#888" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "85%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubtitle: { marginVertical: 10, color: "#666" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#999",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSendBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontWeight: "700" },
});
