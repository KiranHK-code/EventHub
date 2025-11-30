import React, { useState } from 'react';
import { View, Text, TextInput,TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function OrganizerSignup() {
  const router = useRouter();

  const [organizerName, setOrganizerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [staffId, setStaffId] = useState('');

  const handleSignup = async () => {
    if (!organizerName || !email || !password || !confirmPassword || !staffId) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    try {
      const response = await fetch('http://192.168.93.107:5000/api/organizers/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizerName,
          email,
          password,
          staffId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Organizer created successfully!');
        router.replace('/(tabs)/Frontend/components/org_login');
      } else {
        Alert.alert('Error', data.message || 'Something went wrong!');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organizer Signup</Text>

      <TextInput style={styles.input} placeholder="Organizer Name" onChangeText={setOrganizerName} />
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        onChangeText={setConfirmPassword}
      />
      <TextInput style={styles.input} placeholder="Staff ID" onChangeText={setStaffId} />


      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Signup</Text>
      </TouchableOpacity>

      <Text style={styles.loginText}>
        Already have an account?{' '}
        <Text style={styles.loginLink} onPress={() => router.push('/(tabs)/Frontend/components/org_login')}>
          Login
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
  loginText: { textAlign: 'center', marginTop: 20 },
  loginLink: { color: 'blue' },
});