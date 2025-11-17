import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

export default function BottomNavBar() {
  const router = useRouter();

  const navItems = [
    { name: "Home", icon: "home", route: "/home" },
    { name: "Events", icon: "event", route: "/events" },
    { name: "Alerts", icon: "notifications", route: "/alerts" },
    { name: "Register", icon: "app-registration", route: "/register" },
    { name: "Profile", icon: "person", route: "/profile" },
  ];

  return (
    <View style={styles.navContainer}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => router.push(item.route)}
        >
          <Icon name={item.icon} size={26} color="#7B61FF" />
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
    color: "#7B61FF",
    fontSize: 12,
    marginTop: 2,
  },
});
