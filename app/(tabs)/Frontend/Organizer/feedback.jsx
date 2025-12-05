
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";
import BottomNavBar from '../components/navbar';

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

const Feedback = () => {
  const [rejectedEvents, setRejectedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const apiBase = useMemo(() => getBaseUrl(), []);

  const fetchRejectedEvents = async () => {
    setLoading(true);
    try {
      const organizerId = await AsyncStorage.getItem('organizerId');
      if (!organizerId) {
        console.log("No organizer ID found");
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${apiBase}/organizer-events?organizerId=${organizerId}`);
      const data = await response.json();

      if (data.success) {
        const rejected = data.events.filter(event => event.status === 'Rejected' && event.reason);
        setRejectedEvents(rejected);
      } else {
        console.error("Failed to fetch events:", data.error);
      }
    } catch (error) {
      console.error("Error fetching rejected events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRejectedEvents();
  }, [apiBase]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRejectedEvents();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejection Feedback</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#8359FF" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {rejectedEvents.length > 0 ? (
            rejectedEvents.map(event => (
              <View key={event._id} style={styles.card}>
                <Text style={styles.eventName}>{event.title}</Text>
                <Text style={styles.reasonLabel}>Reason for Rejection:</Text>
                <Text style={styles.reasonText}>{event.reason}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noFeedbackText}>No rejection feedback found.</Text>
          )}
        </ScrollView>
      )}
       <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEAFE',
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
  },
  noFeedbackText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default Feedback;
