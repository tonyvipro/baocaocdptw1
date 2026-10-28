import axios from 'axios';

const BASE_URL = '/api';

/**
 * Service API Quản lý Công nợ và Thanh toán (Spec Hình 45 & Nhóm 9 Tài Chính)
 */
export const paymentApi = {
  /**
   * Lấy danh sách công nợ (có tìm kiếm, lọc tháng, loại khoản thu, trạng thái, phân trang)
   */
  fetchDebts: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/payments/debts`, { params });
    return response.data;
  },

  /**
   * Lấy dữ liệu 4 thẻ thống kê theo tháng được chọn
   */
  fetchSummary: async (month) => {
    const response = await axios.get(`${BASE_URL}/payments/debts/summary`, {
      params: { month },
    });
    return response.data;
  },

  /**
   * Lấy chi tiết công nợ một hóa đơn
   */
  fetchDebtDetail: async (invoiceId) => {
    const response = await axios.get(`${BASE_URL}/payments/debts/${invoiceId}`);
    return response.data;
  },

  /**
   * Lấy lịch sử tất cả các giao dịch của hóa đơn (drawer lịch sử)
   */
  fetchInvoiceTransactions: async (invoiceId) => {
    const response = await axios.get(`${BASE_URL}/invoices/${invoiceId}/payments`);
    return response.data;
  },

  /**
   * Ghi nhận thanh toán thủ công (nhập tay)
   */
  recordPayment: async (invoiceId, payload) => {
    const response = await axios.post(`${BASE_URL}/invoices/${invoiceId}/payments`, payload);
    return response.data;
  },

  /**
   * Khởi tạo giao dịch thanh toán QR qua cổng (SePay / Mock / MoMo)
   */
  createQrPayment: async (invoiceId, payload) => {
    const response = await axios.post(`${BASE_URL}/invoices/${invoiceId}/payments/qr`, payload);
    return response.data;
  },

  /**
   * Hỏi trạng thái giao dịch (Polling kèm tự động đồng bộ từ cổng)
   */
  pollTransactionStatus: async (transactionCode) => {
    const response = await axios.get(`${BASE_URL}/payment-transactions/${transactionCode}`);
    return response.data;
  },

  /**
   * Hủy giao dịch QR đang trong trạng thái chờ xử lý
   */
  cancelQrPayment: async (transactionCode) => {
    const response = await axios.post(`${BASE_URL}/payment-transactions/${transactionCode}/cancel`);
    return response.data;
  },

  /**
   * Hủy giao dịch thanh toán nhập tay (Chỉ Admin)
   */
  cancelManualPayment: async (transactionId, reason) => {
    const response = await axios.post(`${BASE_URL}/payment-transactions/${transactionId}/cancel-manual`, { reason });
    return response.data;
  },

  /**
   * Lấy thông tin giao dịch giả lập (MockGateway)
   */
  fetchMockPaymentInfo: async (transactionCode) => {
    const response = await axios.get(`${BASE_URL}/mock-gateway/pay/${transactionCode}`);
    return response.data;
  },

  /**
   * Kích hoạt hành động thanh toán giả lập (success, failed, cancel)
   */
  submitMockPaymentAction: async (transactionCode, action) => {
    const response = await axios.post(`${BASE_URL}/mock-gateway/pay/${transactionCode}/${action}`);
    return response.data;
  },
};

export default paymentApi;
