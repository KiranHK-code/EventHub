import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";
import BottomNavBar from '../components/navbar';

// --- Helper to get API URL ---
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000`;
  }
  return "http://localhost:5000";
};

// Mock function to get the current student's ID.
// In a real app, you would get this from your authentication context or secure storage.
const getStudentId = async () => {
  // In a real app, you'd get this from AsyncStorage after login
  // const studentData = await AsyncStorage.getItem('student_profile'); 
  // return studentData ? JSON.parse(studentData)._id : null;
  return '66549b3a58518b7617456360'; // Replace with a real student ID from your DB for testing
};

const RegisteredEventsScreen = () => {
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const apiBase = useMemo(() => getBaseUrl(), []);

  // Fetch registered events from the backend
  const fetchRegisteredEvents = async () => {
    setLoading(true);
    try {
      const studentId = await getStudentId();
      if (!studentId) {
        setLoading(false);
        return;
      }
      const response = await fetch(`${apiBase}/api/students/${studentId}/registered-events`);
      const data = await response.json();
      if (data.success) {
        setRegisteredEvents(data.events);
      } else {
        console.error("Failed to fetch registered events:", data.message);
      }
    } catch (error) {
      console.error('Failed to fetch registered events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredEvents();
  }, []);

  const handleViewDetails = (eventId) => {
    router.push({
      pathname: "/(tabs)/Frontend/Student/EventDetailsScreen",
      params: { eventId },
    });
  };

  const renderEventItem = ({ item }) => {
    const { basicInfo, eventDetails } = item;
    return (
      <View style={styles.eventCard}>
        {basicInfo.poster ? (
          <Image source={{ uri: basicInfo.poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]} />
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.eventName}>{basicInfo.eventName}</Text>
          <Text style={styles.eventDetail}>
            Date: {eventDetails.startDate ? new Date(eventDetails.startDate).toLocaleDateString() : 'TBD'}
          </Text>
          <Text style={styles.eventDetail}>
            Venue: {eventDetails.venue || 'TBD'}
          </Text>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => handleViewDetails(basicInfo._id)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6F45F0" />
        <Text style={styles.loadingText}>Loading Your Registered Events...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Registered Events</Text>
      </View>
      <FlatList
        data={registeredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.basicInfo._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't registered for any events yet.</Text>
            <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)/Frontend/Student/student_event')}>
              <Text style={styles.exploreButtonText}>Explore Events</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1FE' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F1FE' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EAEAEA', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  listContainer: { padding: 16, paddingBottom: 100 },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  poster: {
    width: 100,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  posterPlaceholder: {
    backgroundColor: '#EAEAEA',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  eventDetail: { fontSize: 14, color: '#666', marginBottom: 6 },
  detailsButton: {
    backgroundColor: '#6F45F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  exploreButton: {
    marginTop: 20,
    backgroundColor: '#6F45F0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
});

export default RegisteredEventsScreen;
