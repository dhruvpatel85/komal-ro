import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { clientApi } from '../../api/clientApi';
import { productImageUri } from '../../utils/productImage';

export default function ProductDetailScreen({ route, navigation }) {
  const product = route?.params?.product || {};
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const max = product.stock_quantity || 1;
  const inStock = max > 0;

  const loadReviews = useCallback(async () => {
    if (!product.product_id) return;
    setLoadingReviews(true);
    try {
      const res = await clientApi.getProductReviews(product.product_id);
      const data = res.data || {};
      setReviews(data.reviews || []);
      setAvgRating(data.average_rating || 0);
      setReviewCount(data.count || 0);
    } catch (e) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [product.product_id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const changeQty = (d) => {
    setQty((q) => Math.max(1, Math.min(max, q + d)));
  };

  const addToCart = async () => {
    if (!product.product_id) return;
    setBusy(true);
    try {
      await clientApi.addToCart(product.product_id, qty);
      Alert.alert('Added to Cart', `${qty} × ${product.name}`, [
        { text: 'Keep shopping', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Could not add to cart');
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    if (!product.product_id) return;
    setSubmitting(true);
    try {
      await clientApi.addProductReview(product.product_id, {
        product_id: product.product_id,
        rating: myRating,
        comment: myComment.trim() || null,
      });
      Alert.alert('Thank you!', 'Your review has been submitted');
      setMyComment('');
      setMyRating(5);
      loadReviews();
    } catch (e) {
      Alert.alert(
        'Could not submit review',
        e.response?.data?.detail || e.message || 'Try again'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const starsText = (n) => {
    const full = Math.round(n) || 0;
    return '★'.repeat(Math.min(5, full)) + '☆'.repeat(Math.max(0, 5 - Math.min(5, full)));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <Image
        source={{ uri: productImageUri(product.image_url) }}
        style={styles.hero}
        resizeMode="cover"
      />

      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>

        <View style={styles.ratingRow}>
          <Text style={styles.stars}>{starsText(avgRating || 0)}</Text>
          <Text style={styles.ratingLink}>
            {reviewCount > 0
              ? `${avgRating} · ${reviewCount} review${reviewCount > 1 ? 's' : ''}`
              : 'No reviews yet'}
          </Text>
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Deal price</Text>
          <Text style={styles.price}>
            ₹{Number(product.price || 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.save}>Inclusive of all taxes · Free installation*</Text>
        </View>

        <Text style={[styles.stock, !inStock && { color: '#b12704' }]}>
          {inStock
            ? `In stock (${product.stock_quantity} available)`
            : 'Currently unavailable'}
        </Text>

        <Text style={styles.section}>About this item</Text>
        <Text style={styles.desc}>
          {product.description ||
            'Premium water purification product from Komal RO System.'}
        </Text>

        {inStock && (
          <View style={styles.actions}>
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Qty:</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(-1)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {busy ? (
              <ActivityIndicator color="#ff9900" style={{ marginVertical: 12 }} />
            ) : (
              <>
                <TouchableOpacity style={styles.cartBtn} onPress={addToCart}>
                  <Text style={styles.cartBtnText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={async () => {
                    await addToCart();
                    navigation.navigate('Cart');
                  }}
                >
                  <Text style={styles.buyBtnText}>Buy Now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* REVIEWS */}
        <Text style={[styles.section, { marginTop: 28 }]}>Customer reviews</Text>

        {loadingReviews ? (
          <ActivityIndicator color="#ff9900" style={{ marginVertical: 12 }} />
        ) : reviews.length === 0 ? (
          <Text style={styles.noReviews}>Be the first to review this product</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.review_id} style={styles.reviewCard}>
              <Text style={styles.reviewName}>{r.user_name || 'Customer'}</Text>
              <Text style={styles.reviewStars}>{starsText(r.rating)}</Text>
              {!!r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
            </View>
          ))
        )}

        <Text style={[styles.section, { marginTop: 20 }]}>Write a review</Text>
        <Text style={styles.rateLabel}>Your rating</Text>
        <View style={styles.starPicker}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setMyRating(n)} style={styles.starHit}>
              <Text style={[styles.starPick, n <= myRating && styles.starOn]}>
                {n <= myRating ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience (optional)"
          placeholderTextColor="#888"
          value={myComment}
          onChangeText={setMyComment}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          disabled={submitting}
          onPress={submitReview}
        >
          {submitting ? (
            <ActivityIndicator color="#0f1111" />
          ) : (
            <Text style={styles.submitText}>Submit review</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { width: '100%', height: 280, backgroundColor: '#f5f5f5' },
  body: { padding: 16 },
  name: { fontSize: 20, fontWeight: '600', color: '#0f1111', lineHeight: 26 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stars: { color: '#de7921', fontSize: 14, marginRight: 6 },
  ratingLink: { color: '#007185', fontSize: 13 },
  priceBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#f7fafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3e6e6',
  },
  priceLabel: { fontSize: 12, color: '#565959' },
  price: { fontSize: 28, fontWeight: '700', color: '#0f1111', marginTop: 2 },
  save: { fontSize: 12, color: '#0f1111', marginTop: 4 },
  stock: { marginTop: 12, fontSize: 15, fontWeight: '600', color: '#007600' },
  section: { marginTop: 18, fontSize: 16, fontWeight: '700', color: '#0f1111' },
  desc: { marginTop: 8, fontSize: 14, color: '#0f1111', lineHeight: 21 },
  actions: { marginTop: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  qtyLabel: { fontSize: 14, marginRight: 10, color: '#0f1111' },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2f2',
    borderWidth: 1,
    borderColor: '#d5d9d9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700' },
  qtyValue: { minWidth: 36, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  cartBtn: {
    backgroundColor: '#ffd814',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fcd200',
  },
  cartBtnText: { fontSize: 16, fontWeight: '600', color: '#0f1111' },
  buyBtn: {
    backgroundColor: '#ffa41c',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff8f00',
  },
  buyBtnText: { fontSize: 16, fontWeight: '600', color: '#0f1111' },
  noReviews: { marginTop: 8, color: '#565959', fontSize: 14 },
  reviewCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewName: { fontWeight: '700', fontSize: 14, color: '#0f1111' },
  reviewStars: { color: '#de7921', marginTop: 4, fontSize: 14 },
  reviewComment: { marginTop: 6, fontSize: 14, color: '#0f1111', lineHeight: 20 },
  rateLabel: { marginTop: 8, fontSize: 13, color: '#565959' },
  starPicker: { flexDirection: 'row', marginVertical: 8 },
  starHit: { paddingHorizontal: 4 },
  starPick: { fontSize: 32, color: '#ccc' },
  starOn: { color: '#de7921' },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d5d9d9',
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0f1111',
    backgroundColor: '#fff',
  },
  submitBtn: {
    marginTop: 12,
    backgroundColor: '#ffd814',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fcd200',
  },
  submitText: { fontSize: 16, fontWeight: '600', color: '#0f1111' },
});