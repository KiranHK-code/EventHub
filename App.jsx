import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CreateEventScreen from "./app/(tabs)/Frontend/Organizer/create_event";
import RegistrationDetailsScreen from "./app/(tabs)/Frontend/Organizer/register_event";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CreateEvent">
        <Stack.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RegistrationDetailsScreen"
          component={RegistrationDetailsScreen}
          options={{ headerShown: false }}
        />
         
      </Stack.Navigator>
    </NavigationContainer>
  );
}
