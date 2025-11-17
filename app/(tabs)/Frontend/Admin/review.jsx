import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";

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
    <ScrollView style={{ padding: 20 }}>
      {combinedData.map((item, index) => (
        <View key={index} style={{ marginBottom: 20, padding: 15, backgroundColor: "#eee", borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Event #{index + 1}</Text>

          <Text style={{ marginTop: 10, fontWeight: "bold" }}>Basic Info</Text>
          <Text>Name: {item.basicInfo.eventName}</Text>
          <Text>Type: {item.basicInfo.eventType}</Text>

          <Text style={{ marginTop: 10, fontWeight: "bold" }}>Event Details</Text>
          <Text>Date: {item.eventDetails.date}</Text>
          <Text>Venue: {item.eventDetails.venue}</Text>

          <Text style={{ marginTop: 10, fontWeight: "bold" }}>Contact Info</Text>
          <Text>Email: {item.contactInfo.email}</Text>
          <Text>Phone: {item.contactInfo.phone}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
