import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { adminApi } from '../../api/adminApi';
import { AuthContext } from '../../context/AuthContext';

export default function DashboardScreen() {
  const { logout } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await adminApi.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load ML predictions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.center} color="#0ea5e9" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin AI Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sales Prediction Model</Text>

        {analytics?.status === 'success' ? (
          <>
            <Text style={styles.dataText}>
              Historical Months: {analytics.historical_months_analyzed}
            </Text>
            <Text style={styles.dataText}>
              Current Month Sales: ₹{analytics.current_month_sales}
            </Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Predicted Next Month</Text>
              <Text style={styles.highlightValue}>₹{analytics.predicted_next_month}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.warningText}>
            {analytics?.message || 'Not enough data to predict. Deliver some orders first.'}
          </Text>
        )}
      </View>

      <View style={styles.buttonGroup}>
        <Button title="Refresh Analytics" onPress={fetchAnalytics} color="#0ea5e9" />
        <View style={styles.spacer} />
        <Button title="Logout" color="#dc2626" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0f172a' },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingBottom: 10,
    marginBottom: 15,
  },
  dataText: { fontSize: 16, marginBottom: 10, color: '#334155' },
  highlightBox: {
    backgroundColor: '#e0f2fe',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  highlightLabel: { fontSize: 14, color: '#0369a1' },
  highlightValue: { fontSize: 28, fontWeight: 'bold', color: '#0369a1' },
  warningText: { color: '#d97706', fontStyle: 'italic', fontSize: 15 },
  buttonGroup: { marginTop: 30 },
  spacer: { height: 12 },
});
