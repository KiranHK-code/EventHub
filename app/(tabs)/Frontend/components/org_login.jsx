import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";

const cleanUrl = (value) => {
  if (!value) return null;
  let url = value.trim();
  if (!/^https?:\/\//.test(url)) { url = `http://${url}`; }
  return url.replace(/\/$/, "");
};

const getBaseUrl = () => {
  const envUrl = cleanUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000`;
  }
  if (Platform.OS === 'android') return "http://10.0.2.2:5000";
  if (Platform.OS === 'ios') return "http://localhost:5000";
  return "http://192.168.93.107:5000";
};

export default function OrgLogin() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const apiBase = useMemo(() => getBaseUrl(), []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }
    try {
      const response = await fetch(`${apiBase}/api/organizers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      // Check for the success flag and the organizer data from your API
      if (data.success && data.organizer) {
        // Save the entire organizer profile object as a string
        await AsyncStorage.setItem('@organizerProfile', JSON.stringify(data.organizer));
        
        // Navigate to the home screen
        router.replace('/(tabs)/Frontend/Organizer/home');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid email or password.');
      }
    } catch (error) {
      Alert.alert('Login Error', 'An error occurred. Please check your connection and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organizer Login</Text>

      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don't have an account?{' '}
        <Text style={styles.signupLink} onPress={() => router.push('/(tabs)/Frontend/components/org_signup')}>
          Signup
        </Text>
      </Text>
    </View>
  );
}



const styles = StyleSheet.create({
    container: { flex: 1, padding: 25, justifyContent: 'center', backgroundColor: '#EDE7FF' },
    title: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#553BFF' },
    input: {
      backgroundColor: '#fff',
      padding: 12,
      borderRadius: 10,
      marginTop: 15,
      elevation: 1,
    },
    button: {
      backgroundColor: '#553BFF',
      padding: 15,
      borderRadius: 10,
      marginTop: 30,
    },
    buttonText: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
    signupText: { textAlign: 'center', marginTop: 20 },
    signupLink: { color: 'blue' },
  });
