import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../api/adminApi';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getOrders();
      setOrders(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      Alert.alert('Success', `Order marked as ${newStatus}`);
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update order');
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Order #{item.order_id}</Text>
      <Text>Amount: ₹{item.total_amount}</Text>
      <Text style={styles.status}>Status: {(item.status || '').toUpperCase()}</Text>

      {item.status === 'pending' && (
        <Button
          title="Accept Order"
          onPress={() => handleUpdateStatus(item.order_id, 'accepted')}
          color="#2563eb"
        />
      )}
      {item.status === 'accepted' && (
        <Button
          title="Mark Shipped"
          onPress={() => handleUpdateStatus(item.order_id, 'shipped')}
          color="#7c3aed"
        />
      )}
      {item.status === 'shipped' && (
        <Button
          title="Mark Delivered"
          onPress={() => handleUpdateStatus(item.order_id, 'delivered')}
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
        data={orders}
        keyExtractor={(item) => item.order_id.toString()}
        renderItem={renderOrder}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
        onRefresh={fetchOrders}
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
