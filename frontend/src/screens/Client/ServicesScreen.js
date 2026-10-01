import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { clientApi } from '../../api/clientApi';

export default function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await clientApi.getServiceTypes();
      setServices(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (serviceId) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      await clientApi.bookService({
        service_id: serviceId,
        scheduled_date: tomorrow.toISOString(),
      });
      Alert.alert('Success', 'Service booked for tomorrow!');
    } catch (error) {
      Alert.alert('Booking Failed', error.response?.data?.detail || 'An error occurred');
    }
  };

  const renderService = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.service_name}</Text>
      <Text style={styles.price}>Base Charge: ₹{item.base_charge}</Text>
      <Button title="Book Now" onPress={() => handleBook(item.service_id)} color="#0ea5e9" />
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={styles.center} color="#0ea5e9" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.service_id.toString()}
        renderItem={renderService}
        ListEmptyComponent={<Text style={styles.empty}>No services available</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center' },
  card: {
    padding: 16,
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 15, color: '#64748b', marginVertical: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#64748b' },
});
