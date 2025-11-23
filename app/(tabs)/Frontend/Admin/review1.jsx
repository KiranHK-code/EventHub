import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReviewDetails() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const params = useLocalSearchParams();

	useEffect(() => {
		fetchEvent();
	}, []);

	const handleApprove = async () => {
		Alert.alert('Approve', 'Event approved.');
		// Optionally: call backend to update status here
	};

	const handleReject = async () => {
		Alert.alert('Reject', 'Event rejected.');
		// Optionally: call backend to update status here
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
		<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
			<Image source={posterSource} style={styles.poster} resizeMode="cover" />

			<View style={styles.content}>
				<Text style={styles.title}>{data.basicInfo?.eventName}</Text>

				<Text style={styles.sectionHeader}>Description</Text>
				<Text style={styles.paragraph}>{data.basicInfo?.description || 'No description provided.'}</Text>

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

				<Text style={styles.sectionHeader}>Contact</Text>
				{Array.isArray(data.contactInfo?.contacts) && data.contactInfo.contacts.length > 0 ? (
					data.contactInfo.contacts.map((c, i) => (
						<View key={i} style={styles.contactRow}>
							<Text style={styles.contactName}>{c.name}</Text>
							<Text style={styles.contactText}>{c.email}</Text>
							<Text style={styles.contactText}>{c.phone}</Text>
						</View>
					))
				) : (
					<Text style={styles.paragraph}>No contact info provided.</Text>
				)}

				<View style={styles.actionRow}>
					<TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={handleApprove}>
						<Text style={styles.actionText}>Approve</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={handleReject}>
						<Text style={styles.actionText}>Reject</Text>
					</TouchableOpacity>
				</View>
			</View>
		</ScrollView>
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
});

