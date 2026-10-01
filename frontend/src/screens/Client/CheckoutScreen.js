import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { clientApi } from '../../api/clientApi';

const PAYMENT_OPTIONS = [
  { id: 'cod', label: 'Cash on Delivery (COD)' },
  { id: 'razorpay', label: 'Razorpay (Demo UPI / Card / NetBanking)' },
  { id: 'upi', label: 'UPI (Quick Demo – auto paid)' },
  { id: 'card', label: 'Card (Quick Demo – auto paid)' },
];

export default function CheckoutScreen({ navigation, route }) {
  const cartTotal = route?.params?.total || 0;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  const [razorModal, setRazorModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const res = await clientApi.getAddresses();
      setAddresses(res.data || []);
      const def = (res.data || []).find((a) => a.is_default);
      if (def) setSelectedAddressId(def.address_id);
      else if (res.data?.length) setSelectedAddressId(res.data[0].address_id);
      else setShowNewForm(true);
    } catch (e) {
      setShowNewForm(true);
    }
  };

  const buildPayload = () => {
    let payload = { payment_method: paymentMethod };
    if (selectedAddressId && !showNewForm) {
      payload.address_id = selectedAddressId;
    } else {
      if (!fullName || !phone || !line1 || !city || !stateName || !pincode) {
        return null;
      }
      payload = {
        ...payload,
        full_name: fullName.trim(),
        phone: phone.trim(),
        address_line1: line1.trim(),
        address_line2: line2.trim() || null,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      };
    }
    return payload;
  };

  const placeOrder = async () => {
    const payload = buildPayload();
    if (!payload) {
      Alert.alert('Missing details', 'Please fill all address fields');
      return;
    }
    setLoading(true);
    try {
      const res = await clientApi.checkout(payload);
      const order = res.data;

      if (paymentMethod === 'razorpay') {
        setPendingOrder(order);
        setRazorModal(true);
      } else {
        Alert.alert(
          'Order Placed!',
          `Order #${order.order_id}\nAmount: ₹${order.total_amount}\nPayment: ${order.payment_method?.toUpperCase()} (${order.payment_status})`,
          [{ text: 'OK', onPress: () => navigation.navigate('CartMain') }]
        );
      }
    } catch (error) {
      Alert.alert('Checkout Failed', error.response?.data?.detail || error.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const completeRazorpayDemo = async (success) => {
    if (!pendingOrder) return;
    setLoading(true);
    try {
      if (success) {
        await clientApi.verifyRazorpay({
          order_id: pendingOrder.order_id,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
        });
        setRazorModal(false);
        Alert.alert(
          'Payment Successful',
          `Razorpay Demo payment completed.\nOrder #${pendingOrder.order_id}\n₹${pendingOrder.total_amount}`,
          [{ text: 'OK', onPress: () => navigation.navigate('CartMain') }]
        );
      } else {
        setRazorModal(false);
        Alert.alert(
          'Payment Cancelled',
          `Order #${pendingOrder.order_id} created but payment is still pending.`
        );
        navigation.navigate('CartMain');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Payment verification failed');
    } finally {
      setLoading(false);
      setPendingOrder(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Checkout</Text>
      <Text style={styles.total}>Total: ₹{Number(cartTotal).toFixed(2)}</Text>

      <Text style={styles.section}>Delivery Address</Text>
      {addresses.map((a) => (
        <TouchableOpacity
          key={a.address_id}
          style={[
            styles.addressCard,
            selectedAddressId === a.address_id && !showNewForm && styles.addressSelected,
          ]}
          onPress={() => {
            setSelectedAddressId(a.address_id);
            setShowNewForm(false);
          }}
        >
          <Text style={styles.addrName}>
            {a.full_name} · {a.phone}
          </Text>
          <Text style={styles.addrText}>
            {a.address_line1}
            {a.address_line2 ? `, ${a.address_line2}` : ''}
          </Text>
          <Text style={styles.addrText}>
            {a.city}, {a.state} - {a.pincode}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.addressCard, showNewForm && styles.addressSelected]}
        onPress={() => setShowNewForm(true)}
      >
        <Text style={styles.addrName}>+ Add new address</Text>
      </TouchableOpacity>

      {showNewForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Full Name *" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Phone *" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <TextInput style={styles.input} placeholder="Address Line 1 *" value={line1} onChangeText={setLine1} />
          <TextInput style={styles.input} placeholder="Address Line 2" value={line2} onChangeText={setLine2} />
          <TextInput style={styles.input} placeholder="City *" value={city} onChangeText={setCity} />
          <TextInput style={styles.input} placeholder="State *" value={stateName} onChangeText={setStateName} />
          <TextInput style={styles.input} placeholder="Pincode *" keyboardType="number-pad" value={pincode} onChangeText={setPincode} />
        </View>
      )}

      <Text style={styles.section}>Payment Method</Text>
      {PAYMENT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.payCard, paymentMethod === opt.id && styles.addressSelected]}
          onPress={() => setPaymentMethod(opt.id)}
        >
          <Text style={styles.addrName}>{opt.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.btnWrap}>
        {loading ? (
          <ActivityIndicator size="large" color="#0ea5e9" />
        ) : (
          <Button
            title={paymentMethod === 'razorpay' ? 'Pay with Razorpay' : 'Place Order'}
            onPress={placeOrder}
            color="#059669"
          />
        )}
      </View>

      <Modal visible={razorModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Razorpay Checkout (Demo)</Text>
            <Text style={styles.modalSub}>Komal RO System</Text>
            <Text style={styles.modalAmount}>
              ₹{pendingOrder?.total_amount?.toFixed(2) || cartTotal}
            </Text>
            <Text style={styles.modalHint}>
              Order ID: {pendingOrder?.razorpay_order_id || pendingOrder?.order_id}
            </Text>
            <Text style={[styles.modalHint, { marginBottom: 16 }]}>
              Demo gateway — no real money is charged.
            </Text>
            <Button
              title="Simulate Successful Payment"
              color="#0ea5e9"
              onPress={() => completeRazorpayDemo(true)}
            />
            <View style={{ height: 10 }} />
            <Button
              title="Cancel Payment"
              color="#94a3b8"
              onPress={() => completeRazorpayDemo(false)}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  total: { fontSize: 18, color: '#059669', fontWeight: '600', marginBottom: 16 },
  section: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  addressCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  addressSelected: { borderColor: '#0ea5e9', borderWidth: 2, backgroundColor: '#f0f9ff' },
  addrName: { fontWeight: '600', fontSize: 15, marginBottom: 4 },
  addrText: { color: '#64748b', fontSize: 13 },
  form: { marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  payCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  btnWrap: { marginTop: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  modalSub: { textAlign: 'center', color: '#64748b', marginBottom: 12 },
  modalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalHint: { textAlign: 'center', color: '#94a3b8', fontSize: 12 },
});