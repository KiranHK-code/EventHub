import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

const RegisteredEventCard = ({ item, apiBase }) => {
  const router = useRouter();
  const { basicInfo, eventDetails } = item;

  if (!basicInfo) {
    return null; // Or a placeholder
  }

  let posterUrl = null;
  if (apiBase && basicInfo.poster) {
    posterUrl = basicInfo.poster.startsWith('http')
      ? basicInfo.poster
      : `${apiBase}/${basicInfo.poster.replace(/\\/g, "/")}`;
  }

  const handleViewDetails = () => {
    router.push({
      pathname: "/(tabs)/Frontend/Student/EventDetailsScreen",
      params: { eventId: basicInfo._id },
    });
  };

  return (
    <View style={styles.registeredCard}>
      {posterUrl && (
        <ImageBackground
          source={{ uri: posterUrl }}
          style={styles.registeredPoster}
          imageStyle={{ borderRadius: 16 }}
        />
      )}

      <View style={styles.registeredInfo}>
        <Text style={styles.registeredTitle} numberOfLines={1}>
          {basicInfo.eventName}
        </Text>
        <Text style={styles.registeredMeta}>{basicInfo.dept}</Text>
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
          onPress={handleViewDetails}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  registeredCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  registeredPoster: {
    width: 80,
    height: 100,
    borderRadius: 16,
    backgroundColor: "#eee",
  },
  registeredInfo: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  registeredTitle: {
    color: "#120E21",
    fontSize: 17,
    fontWeight: "800",
  },
  registeredMeta: {
    color: "#4F4B61",
    fontSize: 13,
    marginTop: 4,
  },
  registeredRight: {
    alignItems: "flex-end",
    justifyContent: 'space-between',
  },
  statusPill: { backgroundColor: "#DFF9EB", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  statusPillText: { color: "#1C8C56", fontWeight: "700", fontSize: 11 },
  viewDetailsBtn: { backgroundColor: "#8562FF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  viewDetailsText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});

export default RegisteredEventCard;