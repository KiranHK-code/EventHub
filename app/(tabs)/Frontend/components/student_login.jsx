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

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const apiBase = useMemo(() => getBaseUrl(), []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }
    try {
      const response = await fetch(`${apiBase}/api/students/login`, {
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

      // Log the full response from the server to see what it contains
      console.log('Server Response Data:', JSON.stringify(data, null, 2));

      // Check for a successful response and the necessary data (_id and token)
      if (response.ok && data._id && data.token) {
        // The student profile is the data object itself, minus the token
        const studentProfile = { ...data };
        delete studentProfile.token;

        await AsyncStorage.setItem('student_token', data.token);
        await AsyncStorage.setItem('student_profile', JSON.stringify(studentProfile));
        Alert.alert('Login Successful');
        // Navigate to the student's home page or dashboard
        router.push('/(tabs)/Frontend/Student/student_home');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid email or password.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Login Error', 'An error occurred. Please check your connection and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <Text style={styles.signupText}>
        Don't have an account?{' '}
        <Text style={styles.signupLink} onPress={() => router.push('/(tabs)/Frontend/components/student_signup')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
};

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
    signupLink: { color: '#553BFF', fontWeight: 'bold' },
});

export default StudentLogin;
