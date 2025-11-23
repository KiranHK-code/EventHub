import { router, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ImageBackground, StyleSheet, TouchableOpacity, Alert, Dimensions, Modal, TextInput } from "react-native";


export default function Review() {
  const [combinedData, setCombinedData] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // pending or approved
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectEventId, setRejectEventId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("http://192.168.93.107:5000/review");
      const json = await res.json();
      setCombinedData(json);
    } catch (err) {
      console.log("❌ fetchData error:", err);
    }
  };

  const handleApprove = async (eventId, index) => {
    try {
      const res = await fetch(`http://192.168.93.107:5000/review/${eventId}`, {
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
      const res = await fetch(`http://192.168.93.107:5000/review/${rejectEventId}`, {
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
              <Text style={styles.eventTitle}>{item.basicInfo?.eventName}</Text>

              {item.basicInfo?.poster ? (
                <ImageBackground source={{ uri: item.basicInfo.poster }} style={styles.poster} imageStyle={{ borderRadius: 0 }} />
              ) : null}

              <Text style={styles.sectionHeader}>Basic Info</Text>
              <Text>Type: {item.basicInfo?.eventType}</Text>

              <Text style={styles.sectionHeader}>Event Details</Text>
              <Text>Date: {item.eventDetails?.date}</Text>
              <Text>Venue: {item.eventDetails?.venue}</Text>

              <Text style={styles.sectionHeader}>Contact Info</Text>
              <Text>Email: {item.contactInfo?.email}</Text>
              <Text>Phone: {item.contactInfo?.phone}</Text>

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
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5",marginTop: 40 },
  tabContainer: { 
    flexDirection: "row", 
    backgroundColor: "#fff", 
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginTop: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd"
  },
  tab: { 
    flex: 1, 
    paddingVertical: 8, 
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#f0f0f0"
  },
  activeTab: { backgroundColor: "#7B61FF" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#333" },
  activeTabText: { color: "#fff" },
  scrollContainer: { flex: 1, padding: 12 },
  card: { marginBottom: 16, padding: 15, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  poster: {
    width: SCREEN_WIDTH,
    height: 180,
    marginLeft: -15,
    marginRight: -15,
    marginBottom: 12,
  },
  eventTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  sectionHeader: { marginTop: 10, fontWeight: 'bold', color: "#333" },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 8 },
  button: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  approveBtn: { backgroundColor: '#4CAF50' },
  rejectBtn: { backgroundColor: '#F44336' },
  reviewBtn: { backgroundColor: '#2196F3' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { fontSize: 16, color: "#999" },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%', maxWidth: 400, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 15 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, textAlignVertical: 'top', fontSize: 14, color: '#333' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalCancelBtn: { flex: 1, backgroundColor: '#999', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalSendBtn: { flex: 1, backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});
