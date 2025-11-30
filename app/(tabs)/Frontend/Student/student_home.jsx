import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import BottomNavBar from "../components/navbar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const REGISTERED_KEY = "student_registered_events";

export default function StudentHome() {
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchApproved();
    loadRegistered();
  }, []);

  const getEventId = (event) =>
    event?.basicInfo?._id ||
    event?.basicInfo?.eventId ||
    event?.basicInfo?.eventName ||
    Math.random().toString();

  const loadRegistered = async () => {
    try {
      const stored = await AsyncStorage.getItem(REGISTERED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRegisteredIds(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.log("❌ loadRegistered error:", error);
    }
  };

  const persistRegistered = async (nextIds) => {
    try {
      await AsyncStorage.setItem(REGISTERED_KEY, JSON.stringify(nextIds));
    } catch (error) {
      console.log("❌ persistRegistered error:", error);
    }
  };

  const handleToggleRegistration = async (eventId) => {
    const exists = registeredIds.includes(eventId);
    const nextIds = exists
      ? registeredIds.filter((id) => id !== eventId)
      : [...registeredIds, eventId];

    setRegisteredIds(nextIds);
    persistRegistered(nextIds);
  };

  const fetchApproved = async () => {
    try {
      const res = await fetch("http://192.168.93.107:5000/review");
      const json = await res.json();

      const approved = (json || []).filter(
        (item) =>
          item.basicInfo &&
          item.basicInfo.status === "approved" &&
          item.basicInfo.poster
      );

      setApprovedEvents(approved);
    } catch (err) {
      console.log("❌ fetchApproved error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sortByDate = (events) => {
    const score = (event) => {
      const { startDate, startTime } = event?.eventDetails || {};
      if (!startDate) return Number.MAX_SAFE_INTEGER;
      const date = new Date(`${startDate} ${startTime || "00:00"}`);
      return isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
    };

    return [...events].sort((a, b) => score(a) - score(b));
  };

  const sortedEvents = useMemo(() => sortByDate(approvedEvents), [approvedEvents]);

  const registeredEvents = useMemo(
    () => sortedEvents.filter((item) => registeredIds.includes(getEventId(item))),
    [sortedEvents, registeredIds]
  );

  const upcomingEvents = useMemo(() => sortedEvents.slice(0, 5), [sortedEvents]);

  const exploreEvents = useMemo(
    () =>
      sortedEvents
        .filter((item) => !registeredIds.includes(getEventId(item)))
        .slice(0, 8),
    [sortedEvents, registeredIds]
  );

  const handleViewAll = () => router.push("/(tabs)/Frontend/Student/student_event");

  const renderPoster = (event, size = "lg") => {
    const eventId = getEventId(event);
    const registered = registeredIds.includes(eventId);

    return (
      <View
        style={[
          styles.posterCard,
          size === "sm" ? styles.posterCardSmall : null,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/Frontend/Student/student_event",
              params: { eventId },
            })
          }
        >
          <ImageBackground
            source={{ uri: event.basicInfo.poster }}
            style={styles.posterImage}
            imageStyle={{ borderRadius: 16 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.posterAction,
            registered ? styles.posterActionActive : null,
          ]}
          onPress={() => handleToggleRegistration(eventId)}
        >
          <Text
            style={[
              styles.posterActionText,
              registered ? styles.posterActionTextActive : null,
            ]}
          >
            {registered ? "Registered" : "Register"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHorizontalList = (data, size) => (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(item, index) => getEventId(item) + index}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => renderPoster(item, size)}
      contentContainerStyle={styles.horizontalList}
    />
  );

  const renderRegisteredCard = (event) => (
    <View style={styles.registeredCard} key={getEventId(event)}>
      <ImageBackground
        source={{ uri: event.basicInfo.poster }}
        style={styles.registeredPoster}
        imageStyle={{ borderRadius: 16 }}
      />

      <View style={styles.registeredInfo}>
        <Text style={styles.registeredTitle} numberOfLines={1}>
          {event.basicInfo?.eventName}
        </Text>
        <Text style={styles.registeredMeta}>{event.basicInfo?.dept}</Text>
        {event.eventDetails?.venue && (
          <Text style={styles.registeredMeta}>
            Venue: {event.eventDetails.venue}
          </Text>
        )}
        {event.eventDetails?.startDate && (
          <Text style={styles.registeredMeta}>
            Date: {event.eventDetails.startDate}
          </Text>
        )}
      </View>

      <View style={styles.registeredRight}>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>Registered</Text>
        </View>

        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/Frontend/Student/student_event",
              params: { eventId: getEventId(event) },
            })
          }
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleToggleRegistration(getEventId(event))}
        >
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7D5BFE" />
        <Text style={styles.loadingText}>Fetching events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Hi, Abhiheet</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SectionHeader title="Upcoming Event" onPress={handleViewAll} />
        {renderHorizontalList(upcomingEvents)}

        <SectionHeader title="Your Registered Events" onPress={handleViewAll} />
        {registeredEvents.length === 0 ? (
          <View style={styles.emptyRegistered}>
            <Text style={styles.emptyRegisteredTitle}>
              No saved registrations
            </Text>
            <Text style={styles.emptyRegisteredDescription}>
              Tap register on an event to save it.
            </Text>
          </View>
        ) : (
          <View>{registeredEvents.map(renderRegisteredCard)}</View>
        )}

        <SectionHeader title="Explore More Events" onPress={handleViewAll} />
        {renderHorizontalList(exploreEvents, "sm")}
      </ScrollView>

      <BottomNavBar />
    </View>
  );
}

const SectionHeader = ({ title, onPress }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity style={styles.viewAllBtn} onPress={onPress}>
      <Text style={styles.viewAllText}>View All</Text>
    </TouchableOpacity>
  </View>
);

const CARD_WIDTH = SCREEN_WIDTH * 0.34;

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: "#EFEAFE" },

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
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  topBarTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },

  scrollContent: { paddingBottom: 110, paddingHorizontal: 16, paddingTop: 18 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
  },

  sectionTitle: { color: "#120E21", fontSize: 20, fontWeight: "800" },

  viewAllBtn: {
    backgroundColor: "#8562FF",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  viewAllText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  posterCard: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.50,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 14,
    backgroundColor: "#fff",
    elevation: 4,
  },

  posterCardSmall: {
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.40,
  },

  posterImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  posterAction: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(7,4,15,0.75)",
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
  },

  posterActionActive: { backgroundColor: "#38C776" },

  posterActionText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  posterActionTextActive: { color: "#fff" },

  horizontalList: {
    paddingLeft: 4,
    paddingRight: 4,
    paddingBottom: 6,
  },

  registeredCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
  },

  registeredPoster: {
    width: 80,
    height: 100,
    borderRadius: 16,
    backgroundColor: "#eee",
  },

  registeredInfo: { flex: 1, paddingHorizontal: 12 },

  registeredTitle: { color: "#120E21", fontSize: 17, fontWeight: "800" },

  registeredMeta: { color: "#4F4B61", fontSize: 13, marginTop: 4 },

  registeredRight: { alignItems: "flex-end" },

  statusPill: {
    backgroundColor: "#DFF9EB",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },

  statusPillText: { color: "#1C8C56", fontWeight: "700", fontSize: 11 },

  viewDetailsBtn: {
    backgroundColor: "#8562FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },

  viewDetailsText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  removeText: { color: "#EE5A5A", fontSize: 11, fontWeight: "700", marginTop: 6 },

  emptyRegistered: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  emptyRegisteredTitle: { color: "#120E21", fontSize: 16, fontWeight: "700" },

  emptyRegisteredDescription: { color: "#4F4B61", marginTop: 6 },

  center: {
    flex: 1,
    backgroundColor: "#EFEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: { color: "#4F4B61", marginTop: 10 },
});
