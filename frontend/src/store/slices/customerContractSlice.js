import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contractDocumentApi } from '../../services/contractDocumentApi';

// ==========================================
// THUNKS
// ==========================================

export const fetchMyContractsThunk = createAsyncThunk(
  'customerContract/fetchMyContracts',
  async (params, { rejectWithValue }) => {
    try {
      const data = await contractDocumentApi.fetchMyContracts(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchMyContractDetailThunk = createAsyncThunk(
  'customerContract/fetchMyContractDetail',
  async (contractId, { rejectWithValue }) => {
    try {
      const data = await contractDocumentApi.fetchMyContractDetail(contractId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchMyContractDocsThunk = createAsyncThunk(
  'customerContract/fetchMyContractDocs',
  async (contractId, { rejectWithValue }) => {
    try {
      const data = await contractDocumentApi.fetchMyContractDocs(contractId);
      return data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ==========================================
// INITIAL STATE
// ==========================================

const initialFilters = {
  search: '',
  status: '',
  page: 1,
};

const initialState = {
  myContracts: [],
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  },
  filters: initialFilters,
  loading: false,
  error: null,

  // Chi tiết hợp đồng đang chọn
  selectedContract: null,
  detailLoading: false,
  detailError: null,

  // Danh sách tài liệu được phép của hợp đồng đang chọn
  myDocuments: [],
  docsLoading: false,
  docsError: null,
};

// ==========================================
// SLICE
// ==========================================

export const customerContractSlice = createSlice({
  name: 'customerContract',
  initialState,
  reducers: {
    setCustomerFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetCustomerFilters: (state) => {
      state.filters = { ...initialFilters };
    },
    clearSelectedContract: (state) => {
      state.selectedContract = null;
      state.myDocuments = [];
      state.detailError = null;
      state.docsError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchMyContracts
    builder
      .addCase(fetchMyContractsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyContractsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.myContracts = action.payload.data || [];
        state.pagination = action.payload.meta || state.pagination;
      })
      .addCase(fetchMyContractsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Không thể tải danh sách hợp đồng của bạn.';
      });

    // fetchMyContractDetail
    builder
      .addCase(fetchMyContractDetailThunk.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchMyContractDetailThunk.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedContract = action.payload;
      })
      .addCase(fetchMyContractDetailThunk.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload || 'Không thể tải chi tiết hợp đồng.';
      });

    // fetchMyContractDocs
    builder
      .addCase(fetchMyContractDocsThunk.pending, (state) => {
        state.docsLoading = true;
        state.docsError = null;
      })
      .addCase(fetchMyContractDocsThunk.fulfilled, (state, action) => {
        state.docsLoading = false;
        state.myDocuments = action.payload;
      })
      .addCase(fetchMyContractDocsThunk.rejected, (state, action) => {
        state.docsLoading = false;
        state.docsError = action.payload || 'Không thể tải danh sách tài liệu.';
      });
  },
});

export const {
  setCustomerFilters,
  resetCustomerFilters,
  clearSelectedContract,
} = customerContractSlice.actions;

export default customerContractSlice.reducer;
