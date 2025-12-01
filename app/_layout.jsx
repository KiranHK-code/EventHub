import { Stack } from "expo-router";
import { AuthProvider } from "./AuthContext";

export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)/Frontend/components/first" />
        <Stack.Screen name="(tabs)/Frontend/Organizer/create_event" />
        <Stack.Screen name="(tabs)/Frontend/Organizer/register_event" />
        <Stack.Screen name="(tabs)/Frontend/Student/register_for_event" />
        <Stack.Screen name="(tabs)/Frontend/Organizer/contact" />
      </Stack>
    </AuthProvider>
  );
}
