import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      const { access_token, role } = res.data;
      await login(access_token, role);
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.message ||
        'Login failed. Check your credentials.';
      Alert.alert('Login Failed', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Komal RO System</Text>
      <Text style={styles.subtitle}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginVertical: 12 }} />
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Login" onPress={handleLogin} color="#0ea5e9" />
        </View>
      )}

      <Button
        title="Don't have an account? Register"
        onPress={() => navigation.navigate('Register')}
        color="gray"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#0f172a' },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 24, color: '#64748b' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    marginBottom: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: { marginBottom: 16 },
});
