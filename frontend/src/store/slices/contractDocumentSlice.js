import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contractDocumentApi } from '../../services/contractDocumentApi';

// ==========================================
// THUNKS
// ==========================================

export const fetchContractsWithDocsThunk = createAsyncThunk(
  'contractDocument/fetchContractsWithDocs',
  async (params, { rejectWithValue }) => {
    try {
      const data = await contractDocumentApi.fetchContractsWithDocs(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchContractDocsThunk = createAsyncThunk(
  'contractDocument/fetchContractDocs',
  async ({ contractId, params }, { rejectWithValue }) => {
    try {
      const data = await contractDocumentApi.fetchContractDocs(contractId, params);
      return { contractId, documents: data.data || [] };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const uploadContractDocsThunk = createAsyncThunk(
  'contractDocument/uploadContractDocs',
  async ({ contractId, formData, onProgress }, { rejectWithValue }) => {
    try {
      const data = await contractDocumentApi.uploadDocs(contractId, formData, onProgress);
      return { contractId, uploaded: data.data || [], message: data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateDocMetadataThunk = createAsyncThunk(
  'contractDocument/updateDocMetadata',
  async ({ documentId, payload }, { rejectWithValue }) => {
    try {
      const data = await contractDocumentApi.updateDoc(documentId, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteContractDocThunk = createAsyncThunk(
  'contractDocument/deleteContractDoc',
  async ({ documentId, contractId }, { rejectWithValue }) => {
    try {
      const data = await contractDocumentApi.deleteDoc(documentId);
      return { documentId, contractId, message: data.message };
    } catch (err) {
      return rejectWithValue({
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
      });
    }
  }
);

// ==========================================
// INITIAL STATE
// ==========================================

const initialFilters = {
  search: '',
  status: '',
  document_type: '',
  date_from: '',
  date_to: '',
  page: 1,
  per_page: 10,
};

const initialState = {
  contractsList: [],
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  },
  filters: initialFilters,
  loading: false,
  error: null,

  // Selected contract & documents
  activeContract: null,
  activeContractDocs: [],
  docsLoading: false,
  docsError: null,

  // Upload state
  uploading: false,
  uploadProgress: 0,

  // Action status (delete, edit)
  actionLoading: null,
  successMessage: null,
};

// ==========================================
// SLICE
// ==========================================

export const contractDocumentSlice = createSlice({
  name: 'contractDocument',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { ...initialFilters };
    },
    setActiveContract: (state, action) => {
      state.activeContract = action.payload;
    },
    clearActiveContract: (state) => {
      state.activeContract = null;
      state.activeContractDocs = [];
      state.docsError = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
      state.docsError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchContractsWithDocs
    builder
      .addCase(fetchContractsWithDocsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractsWithDocsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.contractsList = action.payload.data || [];
        state.pagination = action.payload.meta || state.pagination;
      })
      .addCase(fetchContractsWithDocsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Không thể tải danh sách hợp đồng.';
      });

    // fetchContractDocs
    builder
      .addCase(fetchContractDocsThunk.pending, (state) => {
        state.docsLoading = true;
        state.docsError = null;
      })
      .addCase(fetchContractDocsThunk.fulfilled, (state, action) => {
        state.docsLoading = false;
        state.activeContractDocs = action.payload.documents;
      })
      .addCase(fetchContractDocsThunk.rejected, (state, action) => {
        state.docsLoading = false;
        state.docsError = action.payload || 'Không thể tải danh sách tài liệu.';
      });

    // uploadContractDocs
    builder
      .addCase(uploadContractDocsThunk.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadContractDocsThunk.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        state.successMessage = action.payload.message || 'Tải lên tài liệu thành công!';
        // Thêm vào danh sách activeContractDocs nếu đang mở hợp đồng này
        if (state.activeContract && state.activeContract.id === action.payload.contractId) {
          state.activeContractDocs = [...action.payload.uploaded, ...state.activeContractDocs];
        }
        // Cập nhật documents_count trong contractsList
        const contract = state.contractsList.find((c) => c.id === action.payload.contractId);
        if (contract) {
          contract.documents_count = (contract.documents_count || 0) + action.payload.uploaded.length;
        }
      })
      .addCase(uploadContractDocsThunk.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload || 'Tải lên tài liệu thất bại.';
      });

    // updateDocMetadata
    builder
      .addCase(updateDocMetadataThunk.pending, (state, action) => {
        state.actionLoading = action.meta.arg.documentId;
      })
      .addCase(updateDocMetadataThunk.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.successMessage = 'Cập nhật tài liệu thành công!';
        const updatedDoc = action.payload;
        state.activeContractDocs = state.activeContractDocs.map((doc) =>
          doc.id === updatedDoc.id ? { ...doc, ...updatedDoc } : doc
        );
      })
      .addCase(updateDocMetadataThunk.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload || 'Không thể cập nhật tài liệu.';
      });

    // deleteContractDoc
    builder
      .addCase(deleteContractDocThunk.pending, (state, action) => {
        state.actionLoading = action.meta.arg.documentId;
      })
      .addCase(deleteContractDocThunk.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.successMessage = action.payload.message || 'Đã xóa tài liệu.';
        state.activeContractDocs = state.activeContractDocs.filter(
          (doc) => doc.id !== action.payload.documentId
        );
        // Giảm documents_count trong contractsList
        const contract = state.contractsList.find((c) => c.id === action.payload.contractId);
        if (contract && contract.documents_count > 0) {
          contract.documents_count -= 1;
        }
      })
      .addCase(deleteContractDocThunk.rejected, (state, action) => {
        state.actionLoading = null;
        const msg = action.payload?.message || 'Không thể xóa tài liệu.';
        state.error = msg;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setActiveContract,
  clearActiveContract,
  setUploadProgress,
  clearMessages,
} = contractDocumentSlice.actions;

export default contractDocumentSlice.reducer;
