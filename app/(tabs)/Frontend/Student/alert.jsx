import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

const getIconForType = (type) => {
  switch (type) {
    case 'New Event':
      return { name: 'explore', color: '#6F45F0' };
    case 'Info':
      return { name: 'info', color: '#03A9F4' };
    default:
      return { name: 'notifications', color: '#888' };
  }
};

const StudentAlertsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const apiBase = useMemo(() => getBaseUrl(), []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/students/notifications`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      } else {
        console.error("Failed to fetch notifications:", data.error);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = (item) => {
    if (item.eventId?._id) {
      router.push({
        pathname: "/(tabs)/Frontend/Student/EventDetailsScreen",
        params: { eventId: item.eventId._id },
      });
    }
  };

  const renderNotificationItem = ({ item }) => {
    const icon = getIconForType(item.type);
    return (
      <TouchableOpacity style={styles.notificationCard} onPress={() => handleNotificationPress(item)}>
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
          <Icon name={icon.name} size={24} color={icon.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6F45F0" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No new notifications.</Text>
            </View>
          }
        />
      )}
      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F1FE' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EAEAEA', backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 100 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1 },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  notificationMessage: { fontSize: 14, color: '#666', marginTop: 4 },
  notificationTime: { fontSize: 12, color: '#999', marginTop: 6, textAlign: 'right' },
  emptyText: { fontSize: 16, color: '#888' },
});

export default StudentAlertsScreen;