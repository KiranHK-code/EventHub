import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, ActivityIndicator, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function StudentEvent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all | technical | cultural | circulars
  const router = useRouter();

  const studentNav = [
    { name: "Home", icon: "home", route: "/(tabs)/Frontend/Student/student_home" },
    { name: "Events", icon: "event", route: "/(tabs)/Frontend/Student/student_event" },
    { name: "Alerts", icon: "notifications", route: "/(tabs)/Frontend/Student/profile" },
    { name: "Register", icon: "app-registration", route: "/(tabs)/Frontend/Student/edit_profile" },
    { name: "Profile", icon: "person", route: "/(tabs)/Frontend/Student/profile" },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://192.168.93.107:5000/review");
      const json = await res.json();
      const approved = (json || []).filter(it => it.basicInfo && it.basicInfo.status === 'approved' && it.basicInfo.poster);
      setEvents(approved);
    } catch (err) {
      console.log('❌ fetchEvents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const technicalTypes = ['hackathon', 'workshop', 'technical'];
  const culturalTypes = ['cultural', 'music', 'dance', 'art', 'drama'];
  const circularTypes = ['circular', 'notice', 'announcement'];

  const filtered = events.filter(item => {
    const t = (item.basicInfo?.eventType || '').toLowerCase();
    if (activeTab === 'all') return true;
    if (activeTab === 'technical') return technicalTypes.some(k => t.includes(k));
    if (activeTab === 'cultural') return culturalTypes.some(k => t.includes(k));
    if (activeTab === 'circulars') return circularTypes.some(k => t.includes(k));
    return true;
  });

  const CARD_GAP = 12;
  const CARD_WIDTH = (SCREEN_WIDTH - CARD_GAP * 3) / 2;

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, { width: CARD_WIDTH, height: CARD_WIDTH * 1.4 }]} activeOpacity={0.85}>
      <ImageBackground source={{ uri: item.basicInfo.poster }} style={styles.poster} imageStyle={{ borderRadius: 12 }} />
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#8359FF" /></View>
  );

  return (
    <View style={styles.fullContainer}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.activeTab]} onPress={() => setActiveTab('all')}>
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'technical' && styles.activeTab]} onPress={() => setActiveTab('technical')}>
            <Text style={[styles.tabText, activeTab === 'technical' && styles.activeTabText]}>Technical</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'cultural' && styles.activeTab]} onPress={() => setActiveTab('cultural')}>
            <Text style={[styles.tabText, activeTab === 'cultural' && styles.activeTabText]}>Cultural</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'circulars' && styles.activeTab]} onPress={() => setActiveTab('circulars')}>
            <Text style={[styles.tabText, activeTab === 'circulars' && styles.activeTabText]}>Circulars</Text>
          </TouchableOpacity>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.center}><Text style={styles.emptyText}>No events found</Text></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(it, idx) => it.basicInfo?._id || String(idx)}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <View style={styles.bottomNav}>
        {studentNav.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => router.push(item.route)}
          >
            <Icon name={item.icon} size={26} color="#896af1ff" />
            <Text style={styles.navText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: '#EFEAFE' },
  container: { flex: 1, backgroundColor: '#EFEAFE', paddingTop: 12, paddingBottom: 70 },
  tabContainer: {
    flexDirection: 'row',
    padding: 8,
    marginHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#EFEAFE',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  activeTab: { backgroundColor: '#8359FF' },
  tabText: { fontSize: 13, color: '#555', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  row: { justifyContent: 'space-between', paddingHorizontal: 12 },
  listContent: { paddingBottom: 24 },
  card: { marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  poster: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center' },
  navText: { color: '#4d2af9ff', fontSize: 12, marginTop: 2 },
});
