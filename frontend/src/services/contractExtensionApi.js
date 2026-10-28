import axios from 'axios';

const BASE_URL = '/api';

export const contractExtensionApi = {
  // Kiểm tra điều kiện đủ để gia hạn
  checkEligibility: async (contractId) => {
    const response = await axios.get(`${BASE_URL}/contracts/${contractId}/extension-eligibility`);
    return response.data;
  },

  // Lấy danh sách lịch sử gia hạn của 1 hợp đồng
  getHistoryByContract: async (contractId, page = 1) => {
    const response = await axios.get(`${BASE_URL}/contracts/${contractId}/extensions`, {
      params: { page }
    });
    return response.data;
  },

  // Lấy bản nháp gia hạn hiện tại (nếu có)
  getDraft: async (contractId) => {
    const response = await axios.get(`${BASE_URL}/contracts/${contractId}/extensions/draft`);
    return response.data;
  },

  // Lưu hoặc tạo bản nháp gia hạn
  saveDraft: async (contractId, payload) => {
    const response = await axios.post(`${BASE_URL}/contracts/${contractId}/extensions`, payload);
    return response.data;
  },

  // Cập nhật bản nháp gia hạn
  updateDraft: async (extensionId, payload) => {
    const response = await axios.put(`${BASE_URL}/contract-extensions/${extensionId}`, payload);
    return response.data;
  },

  // Gửi yêu cầu gia hạn lên cấp trên duyệt
  submitExtension: async (extensionId, payload) => {
    const response = await axios.post(`${BASE_URL}/contract-extensions/${extensionId}/submit`, payload);
    return response.data;
  },

  // Phê duyệt yêu cầu gia hạn (Admin)
  approveExtension: async (extensionId) => {
    const response = await axios.post(`${BASE_URL}/contract-extensions/${extensionId}/approve`);
    return response.data;
  },

  // Từ chối yêu cầu gia hạn (Admin)
  rejectExtension: async (extensionId, payload) => {
    const response = await axios.post(`${BASE_URL}/contract-extensions/${extensionId}/reject`, payload);
    return response.data;
  },

  // Hủy/rút lại yêu cầu gia hạn
  cancelExtension: async (extensionId, payload = {}) => {
    const response = await axios.post(`${BASE_URL}/contract-extensions/${extensionId}/cancel`, payload);
    return response.data;
  },

  // Xóa bản nháp
  deleteDraft: async (extensionId) => {
    const response = await axios.delete(`${BASE_URL}/contract-extensions/${extensionId}`);
    return response.data;
  },

  // Upload tài liệu đính kèm phụ lục gia hạn
  uploadDocuments: async (extensionId, files) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i]);
    }
    const response = await axios.post(
      `${BASE_URL}/contract-extensions/${extensionId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  // Xóa 1 tài liệu đính kèm
  deleteDocument: async (documentId) => {
    const response = await axios.delete(`${BASE_URL}/contract-documents/${documentId}`);
    return response.data;
  },

  // Lấy toàn bộ danh sách yêu cầu gia hạn (phân trang + lọc theo trạng thái)
  getAllExtensions: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/contract-extensions`, { params });
    return response.data;
  }
};
