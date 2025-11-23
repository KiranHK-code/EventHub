import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";

export default function RoleScreen({ navigation }) {
    const router = useRouter();
  return (
    <View style={styles.container}>
      {/* LOGO */}
      <Text style={styles.logo}>LOGO</Text>

      {/* ADMIN BUTTON */}
      <TouchableOpacity style={styles.btn} onPress={()=>{router.push("/(tabs)/Frontend/Admin/review")}}>
        <Icon name="user" size={22} color="#000" style={styles.icon} />
        <Text style={styles.btnText} >ADMIN</Text>
      </TouchableOpacity>

      {/* ORGANIZER BUTTON */}
      <TouchableOpacity style={styles.btn} onPress={()=>{router.push("/(tabs)/Frontend/Organizer/create_event")}}>
        <Icon name="user" size={22} color="#000" style={styles.icon} />
        <Text style={styles.btnText}>ORGANIZER</Text>
      </TouchableOpacity>

      {/* STUDENT BUTTON */}
      <TouchableOpacity style={styles.btn}>
        <Icon name="graduation-cap" size={22} color="#000" style={styles.icon} />
        <Text style={styles.btnText}>STUDENT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  logo: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 50,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    width: "85%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#efeaff",
    borderRadius: 20,
    marginVertical: 10,
    elevation: 4,
  },

  icon: {
    marginRight: 15,
  },

  btnText: {
    fontSize: 20,
    color: "#4A34E7",
    fontWeight: "700",
  },
});
