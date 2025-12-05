import React, { useEffect, useState, useMemo} from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomNavBar from '../components/navbar';
import Constants from "expo-constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export default function ReviewDetails() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const params = useLocalSearchParams();
	const apiBase = useMemo(() => getBaseUrl(), []);

	useEffect(() => {
		if (params.id) {
			fetchEvent(params.id);
		}
	}, []);

	const router = useRouter();

	const handleApprove = async () => {
		try {
			const res = await fetch(`${apiBase}/review/${data.basicInfo._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'approved' })
			});
			const result = await res.json();
			if (result.success) {
				Alert.alert('Success', 'Event approved!');
				// navigate back to review list so it refreshes
				router.push('/(tabs)/Frontend/Admin/review');
			} else {
				Alert.alert('Error', result.error || 'Failed to approve');
			}
		} catch (err) {
			Alert.alert('Error', err.message);
		}
	};

	const handleReject = () => {
		setRejectReason("");
		setShowRejectModal(true);
	};

	const sendRejectionEmail = async () => {
		if (!rejectReason.trim()) {
			Alert.alert("Error", "Please enter a rejection reason");
			return;
		}

		try {
			const res = await fetch(`${apiBase}/review/${data.basicInfo._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "rejected", rejectionReason: rejectReason })
			});
			const result = await res.json();
			if (result.success) {
				Alert.alert("Success", "Event rejected and email sent!");
				setShowRejectModal(false);
				setRejectReason("");
				fetchEvent(); // Refresh data
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
	};

	const fetchEvent = async (eventId) => {
		setLoading(true);
		try {
			// Fetch only the specific event using its ID
			const res = await fetch(`${apiBase}/review/${eventId}`);
			const json = await res.json();
			setData(json);
		} catch (err) {
			console.error('❌ fetchEvent error:', err);
			Alert.alert("Error", "Failed to load event details.");
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
	if (!data) return <View style={styles.center}><Text>No event found.</Text></View>;

	const posterSource = data.basicInfo?.poster
		? { uri: `${data.basicInfo.poster.replace(/\\/g, '/')}` }
		: require('../../../../assets/images/CEMS-4 (2).png');

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="light-content" backgroundColor="#000" />
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Review Event</Text>
			</View>
			<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
				{data.basicInfo?.poster ? (
					<Image source={posterSource} style={styles.poster} resizeMode="cover" />
				) : (
					<View style={[styles.poster, styles.posterPlaceholder]}>
						<Text style={styles.posterPlaceholderText}>No Poster</Text>
					</View>
				)}

				<View style={styles.content}>
					<Text style={styles.title}>{data.basicInfo?.eventName}</Text>

					<View style={styles.card}>
						<Text style={styles.sectionHeader}>Description</Text>
						<Text style={styles.paragraph}>{data.basicInfo?.description || 'No description provided.'}</Text>
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionHeader}>Event Details</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>Type:</Text> {data.basicInfo?.eventType || 'N/A'}</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>Department:</Text> {data.basicInfo?.dept || 'N/A'}</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>Start Date:</Text> {data.eventDetails?.startDate ? new Date(data.eventDetails.startDate).toLocaleDateString() : 'N/A'}</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>End Date:</Text> {data.eventDetails?.endDate ? new Date(data.eventDetails.endDate).toLocaleDateString() : 'N/A'}</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>Start Time:</Text> {data.eventDetails?.startTime ? new Date(data.eventDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>End Time:</Text> {data.eventDetails?.endTime ? new Date(data.eventDetails.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>Venue:</Text> {data.eventDetails?.venue || 'N/A'}</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>Participants:</Text> {data.eventDetails?.participants || 'N/A'}</Text>
						<Text style={styles.detailText}><Text style={styles.detailLabel}>Free Event:</Text> {data.eventDetails?.isFreeEvent ? 'Yes' : 'No'}</Text>
						{!data.eventDetails?.isFreeEvent && <Text style={styles.detailText}><Text style={styles.detailLabel}>Price:</Text> {data.eventDetails?.price || 'N/A'}</Text>}
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionHeader}>Key Highlights</Text>
						{Array.isArray(data.contactInfo?.highlights) && data.contactInfo.highlights.length > 0 ? (
							data.contactInfo.highlights.map((h, i) => (
								<Text key={i} style={styles.bullet}>• {h.text}</Text>
							))
						) : (
							<Text style={styles.paragraph}>No highlights provided.</Text>
						)}
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionHeader}>Schedule</Text>
						{Array.isArray(data.contactInfo?.schedule) && data.contactInfo.schedule.length > 0 ? (
							data.contactInfo.schedule.map((s, i) => (
								<View key={i} style={styles.scheduleRow}>
									<Text style={styles.time}>{s.time}</Text>
									<Text style={styles.task}>{s.task}</Text>
								</View>
							))
						) : (
							<Text style={styles.paragraph}>No schedule provided.</Text>
						)}
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionHeader}>Contact Person</Text>
						<Text style={styles.contactName}>{data.contactInfo?.name || 'N/A'}</Text>
						<Text style={styles.contactText}>{data.contactInfo?.email || 'N/A'}</Text>
						<Text style={styles.contactText}>{data.contactInfo?.phone || 'N/A'}</Text>
					</View>
				</View>
			</ScrollView>

			{/* Floating Action Buttons */}
			<View style={styles.actionRow}>
				<TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={handleReject}>
					<Text style={styles.actionText}>Reject</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={handleApprove}>
					<Text style={styles.actionText}>Approve</Text>
				</TouchableOpacity>
			</View>

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
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#F4EEFB' },
	container: { flex: 1, backgroundColor: '#F4EEFB' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		backgroundColor: '#000',
		paddingBottom: 16,
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 40,
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1F1F1F',
		marginRight: 12,
	},
	headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
	poster: {
		width: SCREEN_WIDTH,
		height: Math.round(SCREEN_HEIGHT * 0.25),
		backgroundColor: '#ddd',
	},
	posterPlaceholder: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#e0e0e0',
	},
	posterPlaceholderText: {
		color: '#888',
		fontWeight: 'bold',
	},
	content: { padding: 16 },
	title: { fontSize: 26, fontWeight: 'bold', marginBottom: 16, color: '#111' },
	card: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		elevation: 2,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 8,
	},
	sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
	paragraph: { fontSize: 15, color: '#555', lineHeight: 22 },
	detailText: { fontSize: 15, color: '#444', marginBottom: 6 },
	detailLabel: { fontWeight: 'bold' },
	bullet: { fontSize: 15, color: '#555', marginVertical: 4, marginLeft: 8 },
	scheduleRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
	time: { width: 90, fontWeight: 'bold', color: '#111' },
	task: { flex: 1, color: '#555' },
	contactName: { fontWeight: 'bold', fontSize: 16, color: '#111' },
	contactText: { color: '#555', marginTop: 4 },
	actionRow: {
		position: 'absolute',
		bottom: 70, // Above the navbar
		left: 0,
		right: 0,
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingHorizontal: 16,
		paddingVertical: 10,
		backgroundColor: 'transparent',
	},
	actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 8, elevation: 3 },
	actionText: { color: '#fff', fontWeight: '700' },
	approveBtn: { backgroundColor: '#28a745' },
	rejectBtn: { backgroundColor: '#dc3545' },
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
