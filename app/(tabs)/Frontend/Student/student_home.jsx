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
import { useRouter, useFocusEffect } from "expo-router";
import BottomNavBar from "../components/navbar";
import Constants from "expo-constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Helper functions to get the API URL ---
const cleanUrl = (value) => {
  if (!value) return null;
  let url = value.trim();
  if (!/^https?:\/\//.test(url)) {
    url = `http://${url}`;
  }
  return url.replace(/\/$/, "");
};

const getBaseUrl = () => {
  // 1. Try to get the base URL from environment variables.
  const envUrl = cleanUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;

  // 2. Fallback to using the host URI from Expo's config.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000`;
  }

  // 3. Final fallback for older setups or edge cases.
  return "http://localhost:5000";
};

import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Helper to get Student ID ---
const getStudentId = async () => {
  const studentData = await AsyncStorage.getItem('student_profile');
  return studentData ? JSON.parse(studentData)._id : null;
};

export default function StudentHome() {
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const apiBase = useMemo(() => getBaseUrl(), []);

  useFocusEffect(
    React.useCallback(() => {
      const loadAllData = async () => {
        setLoading(true);
        await Promise.all([fetchApproved(), fetchRegisteredEvents()]);
        setLoading(false);
      };
      loadAllData();
    }, [])
  );

  const getEventId = (event) =>
    event?.basicInfo?._id ||
    event?.basicInfo?.eventId ||
    event?.basicInfo?.eventName ||
    Math.random().toString();

  const fetchApproved = async () => {
    try {
      const res = await fetch(`${apiBase}/review`);
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
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const studentId = await getStudentId();
      if (!studentId) return;

      const response = await fetch(`${apiBase}/api/students/${studentId}/registered-events`);
      const data = await response.json();
      if (data.success) {
        setRegisteredEvents(data.events);
      } else {
        console.error("Failed to fetch registered events:", data.message);
      }
    } catch (error) {
      console.error('Failed to fetch registered events:', error);
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

  const upcomingEvents = useMemo(() => sortedEvents.slice(0, 5), [sortedEvents]);

  const exploreEvents = useMemo(() => {
    const registeredIds = new Set(registeredEvents.map(e => e.basicInfo._id));
    return sortedEvents
      .filter((item) => !registeredIds.has(getEventId(item)))
      .slice(0, 8);
  }, [sortedEvents, registeredEvents]);

  const handleViewAllExplore = () => router.push("/(tabs)/Frontend/Student/student_event");
  const handleViewAllRegistered = () => router.push("/(tabs)/Frontend/Student/register");

  const renderPoster = (event, size = "lg", apiBase) => {
    const eventId = getEventId(event);
    const posterUrl = event.basicInfo.poster.startsWith('http')
      ? event.basicInfo.poster
      : `${apiBase}/${event.basicInfo.poster.replace(/\\/g, "/")}`;

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
              pathname: "/(tabs)/Frontend/Student/EventDetailsScreen",
              params: { eventId },
            })
          }
        >
          <ImageBackground
            source={{ uri: posterUrl }}
            style={styles.posterImage}
            imageStyle={{ borderRadius: 16 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.posterAction}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/Frontend/Student/EventDetailsScreen",
              params: { eventId },
            })
          }
        >
          <Text style={styles.posterActionText}>View</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHorizontalList = (data, size, apiBase) => (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(item, index) => getEventId(item) + index}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => renderPoster(item, size, apiBase)}
      contentContainerStyle={styles.horizontalList}
    />
  );

  const renderRegisteredCard = ({ item, apiBase }) => {
    const { basicInfo, eventDetails } = item;
    const posterUrl = basicInfo.poster.startsWith('http')
      ? basicInfo.poster
      : `${apiBase}/${basicInfo.poster.replace(/\\/g, "/")}`;
    return (
      <View style={styles.registeredCard} key={basicInfo._id}>
        <ImageBackground
          source={{ uri: posterUrl }}
          style={styles.registeredPoster}
          imageStyle={{ borderRadius: 16 }}
        />

        <View style={styles.registeredInfo}>
          <Text style={styles.registeredTitle} numberOfLines={1}>
            {basicInfo?.eventName}
          </Text>
          <Text style={styles.registeredMeta}>{basicInfo?.dept}</Text>
          {eventDetails?.venue && (
            <Text style={styles.registeredMeta}>
              Venue: {eventDetails.venue}
            </Text>
          )}
          {eventDetails?.startDate && (
            <Text style={styles.registeredMeta}>
              Date: {new Date(eventDetails.startDate).toLocaleDateString()}
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
              pathname: "/(tabs)/Frontend/Student/EventDetailsScreen",
              params: { eventId: basicInfo._id },
            })
          }
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  )};

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
        <SectionHeader title="Upcoming Event" onPress={handleViewAllExplore} />
        {renderHorizontalList(upcomingEvents, "lg", apiBase)}

        <SectionHeader title="Your Registered Events" onPress={handleViewAllRegistered} />
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
          <FlatList
            data={registeredEvents}
            renderItem={({ item }) => renderRegisteredCard({ item, apiBase })}
            keyExtractor={(item) => item.basicInfo._id}
            scrollEnabled={false}
          />
        )}

        <SectionHeader title="Explore More Events" onPress={handleViewAllExplore} />
        {renderHorizontalList(exploreEvents, "sm", apiBase)}
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
