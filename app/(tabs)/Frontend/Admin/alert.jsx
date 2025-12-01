import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Alert, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import BottomNavBar from '../components/navbar';

const API_BASE_URL = "http://192.168.93.107:5000";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper to show relative time like "2 min ago", "1 hour ago"
  const timeAgo = (isoDate) => {
    if (!isoDate) return '';
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    if (isNaN(then)) return '';
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin-notifications`);
      if (!res.ok) {
        console.warn('Notifications endpoint returned', res.status);
        setNotifications([]);
        setUnreadCount(0);
        if (loading) setLoading(false);
        return;
      }

      // try to parse JSON safely
      let result;
      try {
        result = await res.json();
      } catch (e) {
        console.warn('Failed to parse notifications JSON:', e);
        setNotifications([]);
        setUnreadCount(0);        
        if (loading) setLoading(false);
        return;
      }

      // support both { success, notifications } shape and raw array fallback
      if (result) {
        const list = Array.isArray(result.notifications) ? result.notifications : (Array.isArray(result) ? result : []);
        setNotifications(list);
        const unread = list.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
      if (loading) setLoading(false);
    } catch (err) {
      console.error("❌ fetchNotifications error:", err);
      if (loading) setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        console.warn('markAsRead returned', res.status);
        // nothing to do
        return;
      }
      // attempt to parse and refresh if possible
      try {
        const result = await res.json();
        if (result && result.success) fetchNotifications();
      } catch (e) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("❌ markAsRead error:", err);
    }
  };

  const handleNotificationPress = (notification) => {
    // Mark as read and show alert
    markAsRead(notification._id);
    Alert.alert(      
      notification.title,
      notification.message,      
      [{ text: "OK", onPress: () => {} }]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </View>
    );
  }

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadBadge} />}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{timeAgo(item.createdAt)}</Text>
      </View>
      <Icon
        name={item.isRead ? "check-circle" : "info-circle"}
        size={16}
        color={item.isRead ? "#ccc" : "#7B61FF"}
        style={styles.icon}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item, index) => (item && (item._id || item.id)) || index.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="bell-slash" size={60} color="#ddd" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      )}
      <BottomNavBar />
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0aff',
    paddingTop: 40, // Added for status bar spacing
    paddingBottom: 20,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff',marginTop: 4 },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  listContent: { paddingHorizontal: 16, paddingVertical: 16 },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  unreadNotification: { backgroundColor: '#f7f5ff', borderLeftWidth: 4, borderLeftColor: '#6A4DFF' },
  notificationContent: { flex: 1, marginRight: 10 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#2c2c2c', flex: 1 },
  unreadBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6A4DFF', marginLeft: 8 },
  message: { fontSize: 14, color: '#555', marginBottom: 8, lineHeight: 20 },
  timestamp: { fontSize: 12, color: '#999' },
  icon: { marginLeft: 10 },
  emptyContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingBottom: 50, // Offset from center
  },
  emptyText: { 
    fontSize: 16, 
    color: '#aaa', 
    marginTop: 20,
    fontWeight: '600',
  },
});
