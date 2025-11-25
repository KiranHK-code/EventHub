import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter, useSegments } from "expo-router";

export default function BottomNavBar() {
  const router = useRouter();
  const segments = useSegments();
  const roleSegment = (segments?.[2] || "").toLowerCase();

  const navItemsMap = {
    organizer: [
      { name: "Home", icon: "home", route: "/(tabs)/Frontend/Organizer/home" },
      { name: "Events", icon: "event", route: "/(tabs)/Frontend/Organizer/create_event" },
      { name: "Alerts", icon: "notifications", route: "/(tabs)/Frontend/Organizer/alert" },
      { name: "Register", icon: "app-registration", route: "Register" },
      { name: "Profile", icon: "person", route: "/(tabs)/Frontend/Organizer/org_profile" },
    ],
    student: [
      { name: "Home", icon: "home", route: "/(tabs)/Frontend/Student/student_home" },
      { name: "Events", icon: "event", route: "/(tabs)/Frontend/Student/student_event" },
      { name: "Alerts", icon: "notifications", route: "alerts" },
      { name: "Register", icon: "app-registration", route: "register" },
      { name: "Profile", icon: "person", route: "/(tabs)/Frontend/Student/profile" },
    ],
    admin: [
      { name: "Home", icon: "home", route: "/(tabs)/Frontend/Admin/re" },
      { name: "Events", icon: "event", route: "/(tabs)/Frontend/Admin/review" },
      { name: "Alerts", icon: "notifications", route: "/(tabs)/Frontend/Admin/alert" },
      { name: "Register", icon: "app-registration", route: "/(tabs)/Frontend/Admin/Edit_profil" },
      { name: "Profile", icon: "person", route: "/(tabs)/Frontend/Admin/profile1" },
    ],
  };

  const navItems = navItemsMap[roleSegment] ?? navItemsMap.organizer;

  return (
    <View style={styles.navContainer}>
      {navItems.map((item) => (
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
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    color: "#4d2af9ff",
    fontSize: 12,
    marginTop: 2,
  },
});
