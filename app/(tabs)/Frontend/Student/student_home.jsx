import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, ActivityIndicator, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function StudentHome() {
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const studentNav = [
    { name: "Home", icon: "home", route: "/(tabs)/Frontend/Student/student_home" },
    { name: "Events", icon: "event", route: "/(tabs)/Frontend/Student/student_event" },
    { name: "Alerts", icon: "notifications", route: "/(tabs)/Frontend/Student/profile" },
    { name: "Register", icon: "app-registration", route: "/(tabs)/Frontend/Student/edit_profile" },
    { name: "Profile", icon: "person", route: "/(tabs)/Frontend/Student/profile" },
  ];

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    try {
      const res = await fetch("http://192.168.93.107:5000/review");
      const json = await res.json();
      const approved = (json || []).filter(item => item.basicInfo && item.basicInfo.status === 'approved' && item.basicInfo.poster);
      setApprovedEvents(approved);
    } catch (err) {
      console.log("❌ fetchApproved error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <ImageBackground source={{ uri: item.basicInfo.poster }} style={styles.poster} imageStyle={{ borderRadius: 12 }} />
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#8359FF" /></View>
  );

  return (
    <View style={styles.fullContainer}>
      <View style={styles.container}>
        <View style={styles.navbar}>
          <Text style={styles.navbarTitle}>Student</Text>
        </View>

        {approvedEvents.length === 0 ? (
          <View style={styles.center}><Text style={styles.emptyText}>No approved events yet</Text></View>
        ) : (
          <FlatList
            data={approvedEvents}
            keyExtractor={(item, idx) => item.basicInfo?._id || String(idx)}
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

const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_GAP * 3) / 2;

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: '#EFEAFE' },
  container: { flex: 1, backgroundColor: "#EFEAFE", paddingTop: 16, paddingBottom: 70 },
  row: { justifyContent: "space-between", paddingHorizontal: CARD_GAP },
  listContent: { paddingBottom: 24 },
  card: { width: CARD_WIDTH, height: CARD_WIDTH * 1.4, marginBottom: CARD_GAP, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  poster: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  navbar: { height: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderBottomColor: '#eee', borderBottomWidth: 1, marginBottom: 8 },
  navbarTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center' },
  navText: { color: '#4d2af9ff', fontSize: 12, marginTop: 2 },
});
