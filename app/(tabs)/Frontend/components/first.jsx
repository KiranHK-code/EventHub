import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";

export default function RoleScreen({ navigation }) {
    const router = useRouter();
  return (
    <View style={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>Select Your Role</Text>

      {/* ADMIN BUTTON */}
      <TouchableOpacity style={styles.btn} onPress={()=>{router.push("/(tabs)/Frontend/components/admin_login")}}>
        <Icon name="user" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.btnText} >ADMIN</Text>
      </TouchableOpacity>

      {/* ORGANIZER BUTTON */}
      <TouchableOpacity style={styles.btn} onPress={()=>{router.push("/(tabs)/Frontend/components/org_login")}}>
        <Icon name="user" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.btnText}>ORGANIZER</Text>
      </TouchableOpacity>

      {/* STUDENT BUTTON */}
      <TouchableOpacity style={styles.btn} onPress={()=>{router.push("/(tabs)/Frontend/components/student_login")}}>
        <Icon name="graduation-cap" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.btnText}>STUDENT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDE7FF",
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#553BFF",
    textAlign: "center",
    marginBottom: 50,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    width: "85%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#553BFF",
    borderRadius: 10,
    marginVertical: 10,
    elevation: 4,
  },

  icon: {
    marginRight: 15,
  },

  btnText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});
