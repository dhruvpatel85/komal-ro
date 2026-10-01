import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from './config';

const authAxios = axios.create({
  baseURL: `${API_BASE}/api/admin`,
});

authAxios.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminApi = {
  getAnalytics: () => authAxios.get('/sales-analytics'),
  getDashboard: () => authAxios.get('/dashboard-summary'),
  getOrders: () => authAxios.get('/orders'),
  updateOrderStatus: (orderId, status) =>
    authAxios.put(`/orders/${orderId}/status`, { status }),
  getBookings: () => authAxios.get('/bookings'),
  updateBookingStatus: (bookingId, status) =>
    authAxios.put(`/bookings/${bookingId}/status`, { status }),
  getComplaints: () => authAxios.get('/complaints'),
};
