import axios from 'axios';
import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/api/auth`;

export const authApi = {
  register: (userData) => axios.post(`${BASE_URL}/register`, userData),

  verifyOtp: (email, otp_code) =>
    axios.post(`${BASE_URL}/verify-otp`, { email, otp_code }),

  login: (credentials) => axios.post(`${BASE_URL}/login`, credentials),
};
