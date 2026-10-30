import axios from 'axios';

const BASE_URL = '/api';

/**
 * Service API Quản lý Tài liệu Hợp đồng (Nhân viên & Khách hàng)
 */
export const contractDocumentApi = {
  // ==========================================
  // 1. DÀNH CHO NHÂN VIÊN (ADMIN & MÔI GIỚI)
  // ==========================================

  /**
   * Lấy danh sách hợp đồng kèm số lượng tài liệu (Màn hình chính Hình 42)
   * @param {Object} params { search, status, document_type, date_from, date_to, page, per_page }
   */
  fetchContractsWithDocs: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/contract-documents`, { params });
    return response.data;
  },

  /**
   * Lấy danh sách tài liệu của một hợp đồng
   * @param {number|string} contractId
   * @param {Object} params { search, document_type, page }
   */
  fetchContractDocs: async (contractId, params = {}) => {
    const response = await axios.get(`${BASE_URL}/contracts/${contractId}/documents`, { params });
    return response.data;
  },

  /**
   * Tải lên một hoặc nhiều tài liệu cho hợp đồng
   * @param {number|string} contractId
   * @param {FormData} formData Chứa files[], document_type, description, extension_id (nếu có)
   * @param {Function} onUploadProgress Callback tiến trình tải lên
   */
  uploadDocs: async (contractId, formData, onUploadProgress) => {
    const response = await axios.post(`${BASE_URL}/contracts/${contractId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Chi tiết metadata của một tài liệu
   * @param {number|string} documentId
   */
  fetchDocDetail: async (documentId) => {
    const response = await axios.get(`${BASE_URL}/contract-documents/${documentId}`);
    return response.data;
  },

  /**
   * Cập nhật metadata tài liệu (tiêu đề, loại tài liệu, mô tả)
   * @param {number|string} documentId
   * @param {Object} payload { title, document_type, description }
   */
  updateDoc: async (documentId, payload) => {
    const response = await axios.put(`${BASE_URL}/contract-documents/${documentId}`, payload);
    return response.data;
  },

  /**
   * Xóa mềm tài liệu
   * @param {number|string} documentId
   */
  deleteDoc: async (documentId) => {
    const response = await axios.delete(`${BASE_URL}/contract-documents/${documentId}`);
    return response.data;
  },

  /**
   * Xem trước inline file stream (PDF/Ảnh)
   * Trả về Blob kèm MIME type
   * @param {number|string} documentId
   */
  previewDoc: async (documentId) => {
    const response = await axios.get(`${BASE_URL}/contract-documents/${documentId}/preview`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Tải file về máy (Attachment)
   * @param {number|string} documentId
   */
  downloadDoc: async (documentId) => {
    const response = await axios.get(`${BASE_URL}/contract-documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ==========================================
  // 2. DÀNH CHO KHÁCH HÀNG (MY CONTRACTS)
  // ==========================================

  /**
   * Lấy danh sách hợp đồng của khách hàng đang đăng nhập
   * (Loại trừ trạng thái Nháp, ưu tiên Đang có hiệu lực)
   * @param {Object} params { search, status, page }
   */
  fetchMyContracts: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/my/contracts`, { params });
    return response.data;
  },

  /**
   * Lấy chi tiết hợp đồng của khách hàng
   * @param {number|string} contractId
   */
  fetchMyContractDetail: async (contractId) => {
    const response = await axios.get(`${BASE_URL}/my/contracts/${contractId}`);
    return response.data;
  },

  /**
   * Lấy danh sách tài liệu khách hàng được phép xem ({0, 1, 4})
   * @param {number|string} contractId
   */
  fetchMyContractDocs: async (contractId) => {
    const response = await axios.get(`${BASE_URL}/my/contracts/${contractId}/documents`);
    return response.data;
  },

  /**
   * Khách hàng xem trước file được phép
   * @param {number|string} documentId
   */
  previewMyDoc: async (documentId) => {
    const response = await axios.get(`${BASE_URL}/my/contract-documents/${documentId}/preview`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Khách hàng tải file được phép
   * @param {number|string} documentId
   */
  downloadMyDoc: async (documentId) => {
    const response = await axios.get(`${BASE_URL}/my/contract-documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default contractDocumentApi;
