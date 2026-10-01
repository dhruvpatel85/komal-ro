import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clientApi } from '../../api/clientApi';
import { productImageUri } from '../../utils/productImage';

const PLACEHOLDER =
  'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qtyMap, setQtyMap] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await clientApi.getProducts();
      const list = response.data || [];
      setProducts(list);
      const initial = {};
      list.forEach((p) => {
        initial[p.product_id] = 1;
      });
      setQtyMap(initial);
    } catch (error) {
      Alert.alert('Error', 'Failed to load products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const changeQty = (productId, delta, maxStock) => {
    setQtyMap((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(maxStock || 99, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = async (productId) => {
    const qty = qtyMap[productId] || 1;
    try {
      await clientApi.addToCart(productId, qty);
      Alert.alert('Added to Cart', `${qty} item(s) added successfully`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add to cart');
    }
  };

  const renderProduct = ({ item }) => {
    const qty = qtyMap[item.product_id] || 1;
    const inStock = (item.stock_quantity || 0) > 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image
          source={{ uri: productImageUri(item.image_url) }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.description || 'Premium RO product from Komal'}
          </Text>

          <View style={styles.ratingRow}>
            <Text style={styles.stars}>★★★★☆</Text>
            <Text style={styles.ratingText}>4.2</Text>
          </View>

          <Text style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
          <Text style={[styles.stock, !inStock && { color: '#dc2626' }]}>
            {inStock ? `In stock (${item.stock_quantity})` : 'Out of stock'}
          </Text>

          {inStock && (
            <>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => changeQty(item.product_id, -1, item.stock_quantity)}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => changeQty(item.product_id, 1, item.stock_quantity)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleAddToCart(item.product_id)}
              >
                <Text style={styles.addBtnText}>Add to Cart</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9900" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131921" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.brand}>Komal RO</Text>
        <Text style={styles.tagline}>Pure water · Delivered</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search RO, filters, AMC..."
          placeholderTextColor="#667"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.product_id)}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 8 }}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Top deals on water purifiers</Text>
        }
        ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaeded' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaeded' },
    header: {
    backgroundColor: '#131921',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  brand: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  tagline: { color: '#ddd', fontSize: 12, marginTop: 2 },
  searchWrap: {
    backgroundColor: '#232f3e',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  search: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 2,
    borderColor: '#febd69',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f1111',
    marginHorizontal: 4,
    marginTop: 12,
    marginBottom: 8,
  },
  row: { justifyContent: 'space-between' },
  card: {
    backgroundColor: '#fff',
    width: '48.5%',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  image: { width: '100%', height: 130, backgroundColor: '#f3f3f3' },
  cardBody: { padding: 10 },
  title: { fontSize: 13, fontWeight: '600', color: '#0f1111', minHeight: 34 },
  desc: { fontSize: 11, color: '#565959', marginTop: 4, minHeight: 30 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stars: { color: '#de7921', fontSize: 12, marginRight: 4 },
  ratingText: { fontSize: 11, color: '#007185' },
  price: { fontSize: 18, fontWeight: '700', color: '#0f1111', marginTop: 6 },
  stock: { fontSize: 11, color: '#007600', marginTop: 2, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f2f2',
    borderWidth: 1,
    borderColor: '#d5d9d9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#0f1111' },
  qtyValue: { minWidth: 28, textAlign: 'center', fontWeight: '600', fontSize: 14 },
  addBtn: {
    backgroundColor: '#ffd814',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fcd200',
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#0f1111' },
  empty: { textAlign: 'center', marginTop: 40, color: '#565959' },
});