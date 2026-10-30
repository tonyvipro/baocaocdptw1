import axios from 'axios';

const BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('3tv_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const depositService = {
  /**
   * Danh sách quản lý tiền cọc (GET /api/deposits)
   */
  fetchDeposits: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/deposits`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * 4 thẻ thống kê tiền cọc (GET /api/deposits/summary)
   */
  fetchSummary: async () => {
    const response = await axios.get(`${BASE_URL}/deposits/summary`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Danh sách khoản cọc chọn trong modal Ghi nhận thu/hoàn (GET /api/deposits/options)
   */
  fetchOptions: async (mode = 'collect', search = '') => {
    const response = await axios.get(`${BASE_URL}/deposits/options`, {
      params: { mode, search: search || undefined },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Chi tiết 1 khoản cọc kèm sổ giao dịch & chứng từ (GET /api/deposits/{id})
   */
  fetchDepositDetail: async (id) => {
    const response = await axios.get(`${BASE_URL}/deposits/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Ghi nhận THU TIỀN CỌC (POST /api/deposits/{id}/collect)
   */
  collectDeposit: async (id, payload) => {
    const response = await axios.post(`${BASE_URL}/deposits/${id}/collect`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Ghi nhận HOÀN TRẢ / KHẤU TRỪ TIỀN CỌC (POST /api/deposits/{id}/refund)
   */
  refundDeposit: async (id, payload) => {
    const response = await axios.post(`${BASE_URL}/deposits/${id}/refund`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Chỉnh sửa thông tin tiền cọc (PATCH /api/deposits/{id})
   */
  updateDeposit: async (id, payload) => {
    const response = await axios.patch(`${BASE_URL}/deposits/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Hủy (void) giao dịch hoàn trả / khấu trừ cọc (POST /api/deposit-movements/{txId}/void)
   */
  voidMovement: async (transactionId, reason) => {
    const response = await axios.post(
      `${BASE_URL}/deposit-movements/${transactionId}/void`,
      { reason },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Khách hàng xem danh sách tiền cọc của mình (GET /api/my-deposits)
   */
  fetchMyDeposits: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/my-deposits`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Lấy thông tin tiền cọc theo hợp đồng (GET /api/contracts/{contractId}/deposit)
   */
  fetchByContract: async (contractId) => {
    const response = await axios.get(`${BASE_URL}/contracts/${contractId}/deposit`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export default depositService;

