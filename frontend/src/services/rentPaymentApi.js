import axios from 'axios';

const BASE_URL = '/api';

/**
 * Service API Quản lý Tiền Thuê (Spec Hình 43 & Mục 5.1)
 */
export const rentPaymentApi = {
  /**
   * Lấy danh sách hóa đơn tiền thuê theo tháng, trạng thái, tìm kiếm, phân trang
   */
  fetchRentPayments: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/rent-payments`, { params });
    return response.data;
  },

  /**
   * Lấy dữ liệu 4 thẻ thống kê theo tháng
   */
  fetchRentSummary: async (month) => {
    const response = await axios.get(`${BASE_URL}/rent-payments/summary`, {
      params: { month },
    });
    return response.data;
  },

  /**
   * Lấy danh sách hóa đơn còn nợ để chọn trong modal ghi nhận
   */
  fetchPayableInvoices: async (search = '') => {
    const response = await axios.get(`${BASE_URL}/rent-payments/payable`, {
      params: { search },
    });
    return response.data;
  },

  /**
   * Lấy chi tiết một hóa đơn tiền thuê kèm danh sách giao dịch
   */
  fetchRentDetail: async (id) => {
    const response = await axios.get(`${BASE_URL}/rent-payments/${id}`);
    return response.data;
  },

  /**
   * Ghi nhận thanh toán tiền thuê mới (nhập tay)
   */
  recordPayment: async (invoiceId, payload) => {
    const response = await axios.post(`${BASE_URL}/invoices/${invoiceId}/payments`, payload);
    return response.data;
  },

  /**
   * Lấy cấu hình giới hạn trường nhập liệu từ backend
   */
  fetchFieldLimits: async () => {
    const response = await axios.get(`${BASE_URL}/meta/field-limits`);
    return response.data;
  },
};

export default rentPaymentApi;
