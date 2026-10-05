import axios from 'axios';
import localProperties from '../data/all_properties.json';

const API_BASE_URL = '/api';

// Cấu hình axios gửi cookie / session
axios.defaults.withCredentials = true;

/**
 * Lấy danh sách Bất động sản từ DB Backend hoặc Fallback
 */
export const fetchProperties = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/properties`, { timeout: 4000 });
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return { data: response.data, source: 'backend' };
    }
  } catch (error) {
    console.info('Backend API not responding, using local fallback:', error.message);
  }
  return { data: localProperties, source: 'local' };
};

/**
 * Đăng ký tài khoản mới (Spec Hình 6, 7, 8)
 */
export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Đăng ký tài khoản không thành công!';
    throw new Error(message);
  }
};

/**
 * Đăng nhập (Spec Hình 5)
 */
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin!';
    throw new Error(message);
  }
};

/**
 * Đăng xuất
 */
export const logoutUser = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/logout`);
    return response.data;
  } catch (error) {
    return { status: 'success' };
  }
};

/**
 * Lấy thông tin user hiện tại
 */
export const getMe = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/me`);
    return response.data;
  } catch (error) {
    return null;
  }
};

/**
 * Cập nhật hồ sơ (Spec Hình 9)
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/profile`, profileData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Cập nhật hồ sơ thất bại!';
    throw new Error(message);
  }
};

/**
 * Đổi mật khẩu (Spec Hình 10)
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/change-password`, passwordData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Đổi mật khẩu thất bại!';
    throw new Error(message);
  }
};

/**
 * Kích hoạt Migrate & Seed Database
 */
export const triggerDatabaseMigration = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/run-migrate`, { timeout: 15000 });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không thể kết nối với máy chủ Backend Laravel.');
  }
};
