import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Alert, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

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
      const res = await fetch(`${API_BASE_URL}/notifications`);
      if (!res.ok) {
        console.warn('Notifications endpoint returned', res.status);
        // Backend notifications were removed; fall back to empty list
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
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
        setLoading(false);
        return;
      }

      // support both { success, notifications } shape and raw array fallback
      if (result) {
        const list = Array.isArray(result.notifications) ? result.notifications : (Array.isArray(result) ? result : []);
        setNotifications(list);
        const unread = list.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
      setLoading(false);
    } catch (err) {
      console.error("❌ fetchNotifications error:", err);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notification/${notificationId}`, {
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
      notification.eventName,
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
      style={[styles.notificationCard, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.eventTitle}>{item.eventName}</Text>
          {!item.read && <View style={styles.unreadBadge} />}
        </View>
        <Text style={styles.message}>{item.message || `New event "${item.eventName}" posted`}</Text>
        <Text style={styles.timestamp}>{timeAgo(item.createdAt)}</Text>
      </View>
      <Icon
        name={item.read ? "circle-o" : "circle"}
        size={16}
        color={item.read ? "#ccc" : "#7B61FF"}
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
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B61FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  unreadNotification: { backgroundColor: '#f0f0ff', borderLeftWidth: 4, borderLeftColor: '#7B61FF' },
  notificationContent: { flex: 1, marginRight: 10 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#333', flex: 1 },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7B61FF' },
  message: { fontSize: 14, color: '#666', marginBottom: 6 },
  timestamp: { fontSize: 12, color: '#999' },
  icon: { marginLeft: 10 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 },
});
