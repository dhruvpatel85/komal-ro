import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authApi } from '../../api/authApi';

export default function OtpScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Enter the 6-digit OTP');
      return;
    }
    if (!email) {
      Alert.alert('Error', 'Email missing. Please register again.');
      navigation.navigate('Register');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp.trim());
      Alert.alert('Success', 'Email verified! You can now login.');
      navigation.navigate('Login');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Invalid or expired OTP';
      Alert.alert('Verification Failed', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.hint}>
        OTP was printed in the backend terminal for: {email || 'your email'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" />
      ) : (
        <Button title="Verify OTP" onPress={handleVerify} color="#0ea5e9" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  hint: { textAlign: 'center', color: '#64748b', marginBottom: 20, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
  },
});
