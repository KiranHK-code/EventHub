import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import BottomNavBar from "../components/navbar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORIES = [
  { key: "all", label: "All Events" },
  { key: "technical", label: "Technical" },
  { key: "cultural", label: "Cultural" },
  { key: "circulars", label: "Circulars" },
];

export default function StudentEvent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://192.168.93.107:5000/review");
      const json = await res.json();
      const approved = (json || []).filter(
        (it) => it.basicInfo && it.basicInfo.status === "approved" && it.basicInfo.poster
      );
      setEvents(approved);
    } catch (err) {
      console.log("❌ fetchEvents error:", err);
    } finally {
      setLoading(false);
    }
  };

  const technicalTypes = ["hackathon", "workshop", "technical"];
  const culturalTypes = ["cultural", "music", "dance", "art", "drama"];
  const circularTypes = ["circular", "notice", "announcement"];

  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      const t = (item.basicInfo?.eventType || "").toLowerCase();
      if (activeTab === "all") return true;
      if (activeTab === "technical") return technicalTypes.some((k) => t.includes(k));
      if (activeTab === "cultural") return culturalTypes.some((k) => t.includes(k));
      if (activeTab === "circulars") return circularTypes.some((k) => t.includes(k));
      return true;
    });
  }, [events, activeTab]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Date: TBD";
    try {
      const date = new Date(dateStr);
      return isNaN(date) ? `Date: ${dateStr}` : `Date: ${date.toDateString()}`;
    } catch (e) {
      return `Date: ${dateStr}`;
    }
  };

  const renderCategoryPills = () => (
    <View style={styles.categoryRow}>
      {CATEGORIES.map((cat) => {
        const active = cat.key === activeTab;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryPill, active ? styles.categoryPillActive : null]}
            onPress={() => setActiveTab(cat.key)}
          >
            <Text style={[styles.categoryLabel, active ? styles.categoryLabelActive : null]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const handleRegisterPress = (eventId) => {
    router.push({
      pathname: "/(tabs)/Frontend/Student/student_home",
      params: { eventId },
    });
  };

  const renderEventCard = ({ item }) => (
    <View style={styles.eventCard}>
      <ImageBackground
        source={{ uri: item.basicInfo.poster }}
        style={styles.cardPoster}
        imageStyle={{ borderRadius: 16 }}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.basicInfo?.eventName || "Event"}</Text>
        <Text style={styles.cardMeta}>{item.basicInfo?.dept ? `Department of ${item.basicInfo.dept}` : ""}</Text>
        <Text style={styles.cardMeta}>{formatDate(item.eventDetails?.startDate)}</Text>
        {item.eventDetails?.startTime ? (
          <Text style={styles.cardMeta}>Time: {item.eventDetails.startTime}</Text>
        ) : null}
        {item.eventDetails?.venue ? (
          <Text style={styles.cardMeta}>Venue: {item.eventDetails.venue}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.registerBtn} onPress={() => handleRegisterPress(item.basicInfo?._id)}>
        <Text style={styles.registerText}>Register Now</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7D5BFE" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Events Hub</Text>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item, idx) => item.basicInfo?._id || String(idx)}
        renderItem={renderEventCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.headerSpacer} />
            {renderCategoryPills()}
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No events found</Text>}
        showsVerticalScrollIndicator={false}
      />

      <BottomNavBar />
    </View>
  );
}

const CARD_HEIGHT = SCREEN_WIDTH * 0.36;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#E9E1FF" },
  topBar: {
    backgroundColor: "#07040F",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  topTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
    backgroundColor: "#E9E1FF",
  },
  headerSpacer: { height: 18 },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  categoryPill: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  categoryPillActive: { backgroundColor: "#896af1ff" },
  categoryLabel: { color: "#403B52", fontWeight: "700", fontSize: 12 },
  categoryLabelActive: { color: "#ffff" },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardPoster: { width: CARD_HEIGHT, height: CARD_HEIGHT, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#120E21" },
  cardMeta: { color: "#4F4B61", fontSize: 12, marginTop: 4 },
  registerBtn: {
    backgroundColor: "#5A33FF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },
  registerText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  center: {
    flex: 1,
    backgroundColor: "#E9E1FF",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#4F4B61", marginTop: 10 },
  emptyText: { color: "#4F4B61", textAlign: "center", marginTop: 40, fontWeight: "600" },
});
