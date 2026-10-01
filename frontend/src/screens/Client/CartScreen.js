import { productImageUri } from '../../utils/productImage';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clientApi } from '../../api/clientApi';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=200&q=60';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await clientApi.getCart();
      setCartItems(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const changeQty = async (item, delta) => {
    const max = item.product?.stock_quantity || 99;
    const next = item.quantity + delta;
    setBusyId(item.id);
    try {
      if (next <= 0) {
        await clientApi.removeCartItem(item.id);
      } else if (next > max) {
        Alert.alert('Stock', `Only ${max} available`);
        return;
      } else {
        await clientApi.updateCartItem(item.id, next);
      }
      const response = await clientApi.getCart();
      setCartItems(response.data || []);
    } catch (error) {
      Alert.alert(
        'Could not update quantity',
        error.response?.data?.detail || error.message || 'Try again'
      );
    } finally {
      setBusyId(null);
    }
  };

  const calculateTotal = () =>
    cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  const goToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart empty', 'Add products before checkout');
      return;
    }
    navigation.navigate('Checkout', { total: calculateTotal() });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.item}>
      <Image
        source={{ uri: productImageUri(item.product?.image_url) }}
        style={styles.thumb}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.product?.name || 'Product'}
        </Text>
        <Text style={styles.unit}>
          ₹{Number(item.product?.price || 0).toLocaleString('en-IN')} each
        </Text>
        <Text style={styles.lineTotal}>
          ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
        </Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            disabled={busyId === item.id}
            onPress={() => changeQty(item, -1)}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            disabled={busyId === item.id}
            onPress={() => changeQty(item, 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ActivityIndicator size="large" style={styles.center} color="#ff9900" />
    );
  }

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Browse the shop and add RO products</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCartItem}
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
          />
          <View style={styles.footer}>
            <View>
              <Text style={styles.subtotalLabel}>
                Subtotal ({cartItems.length} items)
              </Text>
              <Text style={styles.totalText}>
                ₹
                {calculateTotal().toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={goToCheckout}>
              <Text style={styles.checkoutText}>Proceed to Buy</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaeded' },
  center: { flex: 1, justifyContent: 'center' },
  item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  thumb: { width: 90, height: 90, borderRadius: 6, backgroundColor: '#f3f3f3' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 14, fontWeight: '600', color: '#0f1111' },
  unit: { fontSize: 12, color: '#565959', marginTop: 4 },
  lineTotal: { fontSize: 16, fontWeight: '700', color: '#0f1111', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f2f2',
    borderWidth: 1,
    borderColor: '#d5d9d9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#0f1111' },
  qtyValue: { minWidth: 28, textAlign: 'center', fontWeight: '600', fontSize: 15 },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  subtotalLabel: { fontSize: 13, color: '#565959' },
  totalText: { fontSize: 22, fontWeight: '700', color: '#0f1111', marginBottom: 12 },
  checkoutBtn: {
    backgroundColor: '#ffd814',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fcd200',
  },
  checkoutText: { fontSize: 16, fontWeight: '600', color: '#0f1111' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f1111' },
  emptySub: { marginTop: 6, color: '#565959' },
});