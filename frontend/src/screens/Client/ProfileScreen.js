import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { clientApi } from '../../api/clientApi';
import { AuthContext } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);
  const [complaintText, setComplaintText] = useState('');
  const [refId, setRefId] = useState('');

  const handleSubmitComplaint = async () => {
    if (!complaintText.trim()) {
      Alert.alert('Error', 'Please describe your issue');
      return;
    }
    try {
      await clientApi.fileComplaint({
        reference_type: 'general',
        reference_id: refId ? parseInt(refId, 10) : null,
        description: complaintText.trim(),
      });
      Alert.alert('Success', 'Complaint registered. We will contact you shortly.');
      setComplaintText('');
      setRefId('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit complaint');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Account & Support</Text>

      <View style={styles.complaintBox}>
        <Text style={styles.title}>File a Complaint</Text>
        <TextInput
          style={styles.input}
          placeholder="Order/Booking ID (Optional)"
          keyboardType="number-pad"
          value={refId}
          onChangeText={setRefId}
        />
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Describe the issue..."
          multiline
          value={complaintText}
          onChangeText={setComplaintText}
        />
        <Button title="Submit Complaint" color="#dc2626" onPress={handleSubmitComplaint} />
      </View>

      <View style={styles.logoutBox}>
        <Button title="Logout" color="#64748b" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f8fafc' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  complaintBox: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  logoutBox: { marginTop: 30 },
});
