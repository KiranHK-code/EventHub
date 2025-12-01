import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const AdminSignUp = () => {
  const [name, setName] = useState('');
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match");
      return;
    }
    if (!name || !adminId || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('http://192.168.93.107:5000/api/admins/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          adminId,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Admin Signup Successful', 'You can now log in.');
        router.push('/(tabs)/Frontend/components/admin_login');
      } else {
        Alert.alert('Admin Signup Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Signup Error', 'An error occurred. Please check your connection and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Signup</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Admin ID"
        value={adminId}
        onChangeText={setAdminId}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(tabs)/Frontend/components/admin_login')}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
      </TouchableOpacity>
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
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold'
  },
  loginText: {
    textAlign: 'center',
    marginTop: 20
  },
  loginLink: {
    color: '#553BFF',
    fontWeight: 'bold'
  },
});

export default AdminSignUp;
