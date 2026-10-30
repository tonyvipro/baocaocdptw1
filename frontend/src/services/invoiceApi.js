import axios from 'axios';

const BASE_URL = '/api';

/**
 * Service API Quản lý Hóa đơn Tài chính (Nhân viên & Khách hàng)
 */
export const invoiceApi = {
  // ==========================================
  // 1. DÀNH CHO NHÂN VIÊN (ADMIN & MÔI GIỚI)
  // ==========================================

  /**
   * Lấy danh sách hóa đơn quản lý (có tìm kiếm, lọc, phân trang)
   */
  fetchInvoices: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/invoices`, { params });
    return response.data;
  },

  /**
   * Lấy chi tiết hóa đơn (kèm hạng mục, giao dịch, thông tin khách/căn hộ)
   */
  fetchInvoiceDetail: async (id) => {
    const response = await axios.get(`${BASE_URL}/invoices/${id}`);
    return response.data;
  },

  /**
   * Lập hóa đơn thủ công mới
   */
  createInvoice: async (payload) => {
    const response = await axios.post(`${BASE_URL}/invoices`, payload);
    return response.data;
  },

  /**
   * Chỉnh sửa hóa đơn chưa thanh toán
   */
  updateInvoice: async (id, payload) => {
    const response = await axios.put(`${BASE_URL}/invoices/${id}`, payload);
    return response.data;
  },

  /**
   * Hủy hóa đơn (bắt buộc nhập lý do hủy, hỗ trợ version chống xung đột)
   */
  cancelInvoice: async (id, cancelReason, version = null) => {
    const payload = { cancel_reason: cancelReason };
    if (version !== null && version !== undefined) {
      payload.version = version;
    }
    const response = await axios.post(`${BASE_URL}/invoices/${id}/cancel`, payload);
    return response.data;
  },

  /**
   * Tải file PDF hóa đơn về máy (Attachment)
   */
  downloadPdf: async (id, invoiceNo = null) => {
    const response = await axios.get(`${BASE_URL}/invoices/${id}/pdf`, {
      params: { download: 1 },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNo || `invoice-${id}`}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  },

  /**
   * Gửi hóa đơn qua email khách hàng
   */
  sendEmail: async (id, email = null) => {
    const payload = email ? { email } : {};
    const response = await axios.post(`${BASE_URL}/invoices/${id}/send-email`, payload);
    return response.data;
  },

  /**
   * Lấy danh sách hóa đơn của một hợp đồng
   */
  fetchContractInvoices: async (contractId) => {
    const response = await axios.get(`${BASE_URL}/contracts/${contractId}/invoices`);
    return response.data;
  },

  // ==========================================
  // 2. DÀNH CHO KHÁCH HÀNG (MY INVOICES)
  // ==========================================

  /**
   * Khách hàng lấy danh sách hóa đơn của chính mình
   */
  fetchMyInvoices: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/my/invoices`, { params });
    return response.data;
  },

  /**
   * Khách hàng xem chi tiết hóa đơn
   */
  fetchMyInvoiceDetail: async (id) => {
    const response = await axios.get(`${BASE_URL}/my/invoices/${id}`);
    return response.data;
  },

  /**
   * Khách hàng tải PDF hóa đơn của chính mình
   */
  downloadMyPdf: async (id, invoiceNo = null) => {
    const response = await axios.get(`${BASE_URL}/my/invoices/${id}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNo || `my-invoice-${id}`}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  },
};

export default invoiceApi;
