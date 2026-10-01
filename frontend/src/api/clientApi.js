import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from './config';

const authAxios = axios.create({
  baseURL: `${API_BASE}/api/client`,
});

authAxios.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const clientApi = {
  getProducts: () => authAxios.get('/products'),
  getProductReviews: (productId) =>
    authAxios.get(`/products/${productId}/reviews`),
  addProductReview: (productId, data) =>
    authAxios.post(`/products/${productId}/reviews`, data),

  getCart: () => authAxios.get('/cart'),
  addToCart: (productId, quantity = 1) =>
    authAxios.post('/cart', { product_id: productId, quantity }),
  updateCartItem: (cartItemId, quantity) =>
    authAxios.put(`/cart/${cartItemId}`, { quantity }),
  removeCartItem: (cartItemId) =>
    authAxios.delete(`/cart/${cartItemId}`),

  getAddresses: () => authAxios.get('/addresses'),
  addAddress: (data) => authAxios.post('/addresses', data),
  deleteAddress: (id) => authAxios.delete(`/addresses/${id}`),

  checkout: (data) => authAxios.post('/checkout', data),
  verifyRazorpay: (data) =>
    authAxios.post('/payment/razorpay/verify', data),
  getOrders: () => authAxios.get('/orders'),

  getServiceTypes: () => authAxios.get('/service-types'),
  bookService: (data) => authAxios.post('/book-service', data),
  getMyBookings: () => authAxios.get('/my-bookings'),
  fileComplaint: (data) => authAxios.post('/complaints', data),
};

