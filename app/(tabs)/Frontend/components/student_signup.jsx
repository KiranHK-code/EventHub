import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, FlatList, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const DEPARTMENTS = [
  { id: '1', name: 'CSE' },
  { id: '2', name: 'CSE(AIML)' },
  { id: '3', name: 'CSE(AI)' },
  { id: '4', name: 'CSBS' },
  { id: '5', name: 'MECH' },
  { id: '6', name: 'CIVIL' },
  { id: '7', name: 'IOT' },
  { id: '8', name: 'MBA' },
  { id: '9', name: 'MCA' },
  { id: '10', name: 'BCA' },
];

const StudentSignUp = () => {
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match");
      return;
    }
    if (!name || !usn || !department || !email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('http://192.168.93.107:5000/api/students/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          usn,
          department,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Signup Successful', 'You can now log in.');
        router.push('/(tabs)/Frontend/components/student_login');
      } else {
        Alert.alert('Signup Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Signup Error', 'An error occurred. Please check your connection and try again.');
    }
  };

  const onSelectDepartment = (selectedDepartment) => {
    setDepartment(selectedDepartment);
    setDepartmentModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Signup</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="USN"
        value={usn}
        onChangeText={setUsn}
      />
      <TouchableOpacity style={styles.input} onPress={() => setDepartmentModalVisible(true)}>
        <Text style={department ? styles.inputText : styles.placeholderText}>
          {department || 'Select Department'}
        </Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDepartmentModalVisible}
        onRequestClose={() => {
          setDepartmentModalVisible(!isDepartmentModalVisible);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select Department</Text>
            <FlatList
              data={DEPARTMENTS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => onSelectDepartment(item.name)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setDepartmentModalVisible(!isDepartmentModalVisible)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
      <Text style={styles.loginText}>
        Already have an account?{' '}
        <Text style={styles.loginLink} onPress={() => router.push('/(tabs)/Frontend/components/student_login')}>
          Login
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
      justifyContent: 'center',
    },
    inputText: {
      fontSize: 14,
    },
    placeholderText: {
      color: '#999',
      fontSize: 14,
    },
    button: {
      backgroundColor: '#553BFF',
      padding: 15,
      borderRadius: 10,
      marginTop: 30,
    },
    buttonText: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
    loginText: { textAlign: 'center', marginTop: 20 },
    loginLink: { color: '#553BFF', fontWeight: 'bold' },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f2',
        width: '100%',
    },
    modalItemText: {
        fontSize: 16,
        textAlign: 'center',
    },
    buttonClose: {
        backgroundColor: '#553BFF', // Match theme color
        marginTop: 15,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default StudentSignUp;
