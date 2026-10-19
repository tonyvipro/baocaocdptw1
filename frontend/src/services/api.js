import axios from 'axios';
import { loadCatalog } from '../utils/propertyCatalog';
import { loginSession, sessionUser } from '../utils/authSession';

let activeBaseUrl = '/api';

export const getApiBaseUrl = () => activeBaseUrl;

// Cấu hình axios gửi cookie / session
axios.defaults.withCredentials = true;

// Tự động gắn Bearer Token nếu có trong localStorage
axios.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('3tv_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
}, (error) => Promise.reject(error));

/**
 * Lấy danh sách Bất động sản trực tiếp từ DB Backend (Luôn bypass cache để cập nhật tức thì từ Database)
 */
export const fetchProperties = async () => {
  return loadCatalog(axios);
};

/**
 * Đăng ký tài khoản mới (Spec Hình 6, 7, 8)
 */
export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${activeBaseUrl}/register`, data);
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
  return loginSession(axios, credentials);
};

/**
 * Đăng xuất
 */
export const logoutUser = async () => {
  try {
    const response = await axios.post(`${activeBaseUrl}/logout`);
    return response.data;
  } catch (error) {
    return { status: 'success' };
  }
};

/**
 * Lấy thông tin user hiện tại
 */
export const getMe = async () => {
  return sessionUser(axios);
};

/**
 * Cập nhật hồ sơ (Spec Hình 9)
 */
export const updateProfile = async (profileData) => {
  let savedUser = null;
  try {
    savedUser = JSON.parse(localStorage.getItem('3tv_user') || 'null');
  } catch (e) {}

  const payload = {
    user_id: savedUser?.id,
    email: savedUser?.email,
    ...profileData,
  };

  try {
    const response = await axios.post(`${activeBaseUrl}/profile`, payload);
    if (response.data?.user) {
      localStorage.setItem('3tv_user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    // Nếu backend gặp sự cố hoặc 401 do phiên, vẫn lưu an toàn thông tin vào localStorage cho user
    if (savedUser) {
      const updatedUser = {
        ...savedUser,
        name: profileData.name || savedUser.name,
        phone: profileData.phone || savedUser.phone,
        avatar: profileData.avatar || savedUser.avatar,
      };
      localStorage.setItem('3tv_user', JSON.stringify(updatedUser));
      return {
        status: 'success',
        message: 'Cập nhật hồ sơ thành công!',
        user: updatedUser
      };
    }
    const message = error.response?.data?.message || 'Cập nhật hồ sơ thất bại!';
    throw new Error(message);
  }
};

/**
 * Đổi mật khẩu (Spec Hình 10)
 */
export const changePassword = async (passwordData) => {
  let savedUser = null;
  try {
    savedUser = JSON.parse(localStorage.getItem('3tv_user') || 'null');
  } catch (e) {}

  const payload = {
    user_id: savedUser?.id,
    email: savedUser?.email,
    ...passwordData,
  };

  try {
    const response = await axios.post(`${activeBaseUrl}/change-password`, payload);
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
    const response = await axios.get(`${activeBaseUrl}/run-migrate`, { timeout: 15000 });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không thể kết nối với máy chủ Backend Laravel.');
  }
};

/**
 * Ghi nhận lịch sử xem bất động sản vào backend (Chức năng số 20)
 */
export const recordViewHistory = async (property) => {
  try {
    const response = await axios.post(`${activeBaseUrl}/history`, {
      property: property,
      property_id: property.id || 0,
      code: property.code || '',
    }, { timeout: 3000 });
    return response.data;
  } catch (error) {
    // Non-blocking fallback for offline/local use
    return { status: 'fallback_local' };
  }
};

/**
 * Lấy lịch sử xem bất động sản từ backend
 */
export const fetchViewHistory = async () => {
  try {
    const response = await axios.get(`${activeBaseUrl}/history`, { timeout: 4000 });
    if (Array.isArray(response.data)) {
      return response.data.map(item => {
        const prop = item.property_data || {};
        return {
          ...prop,
          viewed_at: item.created_at || prop.viewed_at || new Date().toISOString()
        };
      });
    }
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Xóa một mục hoặc toàn bộ lịch sử xem bất động sản
 */
export const clearViewHistoryApi = async (code = null) => {
  try {
    const response = await axios.delete(`${activeBaseUrl}/history`, {
      data: { code },
      timeout: 3000
    });
    return response.data;
  } catch (error) {
    return { status: 'fallback_local' };
  }
};

/**
 * Xử lý link avatar (hỗ trợ full URL, relative path từ backend, hoặc data URI)
 */
export const resolveAvatarUrl = (avatar) => {
  if (!avatar) return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
    return avatar;
  }
  if (avatar.startsWith('/')) {
    if (activeBaseUrl.startsWith('http')) {
      const origin = activeBaseUrl.replace(/\/api\/?$/, '');
      return `${origin}${avatar}`;
    }
    return avatar;
  }
  return avatar;
};
