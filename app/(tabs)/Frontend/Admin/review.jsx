import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet } from "react-native";

export default function Review() {
  const [combinedData, setCombinedData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("http://192.168.93.107:5000/review");
      const json = await res.json();
      setCombinedData(json);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {combinedData.map((item, index) => (
        <View key={index} style={styles.card}>
          {item.basicInfo?.poster ? (
            <Image source={{ uri: item.basicInfo.poster }} style={styles.poster} />
          ) : null}

          <Text style={styles.eventTitle}>Event #{index + 1}</Text>

          <Text style={styles.sectionHeader}>Basic Info</Text>
          <Text>Name: {item.basicInfo?.eventName}</Text>
          <Text>Type: {item.basicInfo?.eventType}</Text>

          <Text style={styles.sectionHeader}>Event Details</Text>
          <Text>Date: {item.eventDetails?.date}</Text>
          <Text>Venue: {item.eventDetails?.venue}</Text>

          <Text style={styles.sectionHeader}>Contact Info</Text>
          <Text>Email: {item.contactInfo?.email}</Text>
          <Text>Phone: {item.contactInfo?.phone}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  card: { marginBottom: 20, padding: 15, backgroundColor: '#eee', borderRadius: 10 },
  poster: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
  eventTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  sectionHeader: { marginTop: 10, fontWeight: 'bold' },
});
