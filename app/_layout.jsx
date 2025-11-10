import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)/Frontend/Organizer/create_event" />
      <Stack.Screen name="(tabs)/Frontend/Organizer/register_event" />
      <Stack.Screen name="(tabs)/Frontend/Organizer/contact" />
    </Stack>
  );
}
