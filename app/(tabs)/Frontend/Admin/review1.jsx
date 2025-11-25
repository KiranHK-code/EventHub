import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomNavBar from '../components/navbar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReviewDetails() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const params = useLocalSearchParams();

	useEffect(() => {
		fetchEvent();
	}, []);

	const router = useRouter();

	const handleApprove = async () => {
		try {
			const res = await fetch(`http://192.168.93.107:5000/review/${data.basicInfo._id}`, {
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
			const res = await fetch(`http://192.168.93.107:5000/review/${data.basicInfo._id}`, {
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

	const fetchEvent = async () => {
		try {
			const res = await fetch('http://192.168.93.107:5000/review');
			const json = await res.json();

			let item = null;
			// Prefer index param (passed as string), fallback to first
			if (params?.index != null) {
				const idx = parseInt(params.index, 10);
				if (!isNaN(idx) && json[idx]) item = json[idx];
			}

			// If an id param is provided, try to find by basicInfo._id
			if (!item && params?.id) {
				item = json.find((it) => it.basicInfo && it.basicInfo._id === params.id);
			}

			if (!item) item = json[0] || null;

			setData(item);
			setLoading(false);
		} catch (err) {
			console.error('❌ fetchEvent error:', err);
			setLoading(false);
		}
	};

	if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
	if (!data) return <View style={styles.center}><Text>No event found.</Text></View>;

	const posterSource = data.basicInfo?.poster
		? { uri: data.basicInfo.poster }
		: require('../../../../assets/images/CEMS-4 (2).png');

	return (
		<View style={{ flex: 1 }}>
			<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
				<Image source={posterSource} style={styles.poster} resizeMode="cover" />

				<View style={styles.content}>
				<Text style={styles.title}>{data.basicInfo?.eventName}</Text>

				<Text style={styles.sectionHeader}>Event Type</Text>
				<Text style={styles.paragraph}>{data.basicInfo?.eventType || 'N/A'}</Text>

				<Text style={styles.sectionHeader}>Department</Text>
				<Text style={styles.paragraph}>{data.basicInfo?.dept || 'N/A'}</Text>

				<Text style={styles.sectionHeader}>Description</Text>
				<Text style={styles.paragraph}>{data.basicInfo?.description || 'No description provided.'}</Text>

				<Text style={styles.sectionHeader}>Event Details</Text>
				<Text style={styles.paragraph}>Start Date: {data.eventDetails?.startDate ? new Date(data.eventDetails.startDate).toLocaleDateString() : 'N/A'}</Text>
				<Text style={styles.paragraph}>End Date: {data.eventDetails?.endDate ? new Date(data.eventDetails.endDate).toLocaleDateString() : 'N/A'}</Text>
				<Text style={styles.paragraph}>Start Time: {data.eventDetails?.startTime ? new Date(data.eventDetails.startTime).toLocaleTimeString() : 'N/A'}</Text>
				<Text style={styles.paragraph}>End Time: {data.eventDetails?.endTime ? new Date(data.eventDetails.endTime).toLocaleTimeString() : 'N/A'}</Text>
				<Text style={styles.paragraph}>Venue: {data.eventDetails?.venue || 'N/A'}</Text>
				<Text style={styles.paragraph}>Participants: {data.eventDetails?.participants || 'N/A'}</Text>
				<Text style={styles.paragraph}>Free Event: {data.eventDetails?.isFreeEvent ? 'Yes' : 'No'}</Text>
				{!data.eventDetails?.isFreeEvent && <Text style={styles.paragraph}>Price: {data.eventDetails?.price || 'N/A'}</Text>}

				<Text style={styles.sectionHeader}>Key Highlights</Text>
				{Array.isArray(data.contactInfo?.highlights) && data.contactInfo.highlights.length > 0 ? (
					data.contactInfo.highlights.map((h, i) => (
						<Text key={i} style={styles.bullet}>• {h.text}</Text>
					))
				) : (
					<Text style={styles.paragraph}>No highlights provided.</Text>
				)}

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

				<Text style={styles.sectionHeader}>Contact Person</Text>
				<Text style={styles.contactName}>{data.contactInfo?.name || 'N/A'}</Text>
				<Text style={styles.contactText}>{data.contactInfo?.email || 'N/A'}</Text>
				<Text style={styles.contactText}>{data.contactInfo?.phone || 'N/A'}</Text>

				<View style={styles.actionRow}>
					<TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={handleApprove}>
						<Text style={styles.actionText}>Approve</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={handleReject}>
						<Text style={styles.actionText}>Reject</Text>
					</TouchableOpacity>
				</View>
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
			</ScrollView>
			<BottomNavBar />
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#fff' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	poster: {
		width: SCREEN_WIDTH,
		height: Math.round(SCREEN_HEIGHT * 0.2), // 20% of screen height
		backgroundColor: '#ddd',
	},
	content: { padding: 16 },
	title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
	sectionHeader: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 6 },
	paragraph: { fontSize: 14, color: '#333' },
	bullet: { fontSize: 14, color: '#333', marginVertical: 4 },
	scheduleRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
	time: { width: 90, fontWeight: '600' },
	task: { flex: 1 },
	contactRow: { marginBottom: 8 },
	contactName: { fontWeight: '700' },
	contactText: { color: '#333' },
	actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
	actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 },
	actionText: { color: '#fff', fontWeight: '700' },
	approveBtn: { backgroundColor: '#4CAF50' },
	rejectBtn: { backgroundColor: '#F44336' },
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

