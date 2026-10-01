import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../api/adminApi';

export default function ManageServices() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getBookings();
      setBookings(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await adminApi.updateBookingStatus(bookingId, newStatus);
      Alert.alert('Success', `Booking marked as ${newStatus}`);
      fetchBookings();
    } catch (error) {
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Booking #{item.booking_id}</Text>
      <Text>Service ID: {item.service_id}</Text>
      <Text>
        Date:{' '}
        {item.scheduled_date
          ? new Date(item.scheduled_date).toLocaleString()
          : 'N/A'}
      </Text>
      <Text style={styles.status}>Status: {(item.status || '').toUpperCase()}</Text>

      {item.status === 'pending' && (
        <Button
          title="Accept Booking"
          onPress={() => handleUpdateStatus(item.booking_id, 'accepted')}
          color="#2563eb"
        />
      )}
      {item.status === 'accepted' && (
        <Button
          title="Mark Completed"
          onPress={() => handleUpdateStatus(item.booking_id, 'completed')}
          color="#059669"
        />
      )}
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={styles.center} color="#0ea5e9" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.booking_id.toString()}
        renderItem={renderBooking}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
        onRefresh={fetchBookings}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center' },
  card: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 17, fontWeight: 'bold' },
  status: { marginVertical: 8, color: '#64748b', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, color: '#64748b' },
});
