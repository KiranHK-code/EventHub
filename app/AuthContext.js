import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// This would be your API call to your backend to verify user credentials
const apiLogin = async (email, password) => {
  // Simulate an API call
  console.log(`Attempting to log in with ${email}`);
  if (email && password) {
    // In a real app, you'd get a user object and a token from your server
    const fakeUser = {
      id: "student123",
      name: "John Doe",
      email: email,
      // You can store other student-specific data here
      activities: ["completed-assignment-1", "registered-for-event-2"],
    };
    const fakeToken = "fake-auth-token";

    await AsyncStorage.setItem("@user_token", fakeToken);
    await AsyncStorage.setItem("@user_data", JSON.stringify(fakeUser));
    return fakeUser;
  }
  return null;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is already logged in when the app starts
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("@user_data");
        if (userDataString) {
          setUser(JSON.parse(userDataString));
        }
      } catch (e) {
        console.error("Failed to load user data.", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (email, password) => {
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
    // When you get new data from your backend, you can update it here and in AsyncStorage
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("@user_token");
    await AsyncStorage.removeItem("@user_data");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};