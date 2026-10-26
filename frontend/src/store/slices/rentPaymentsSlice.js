import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { rentPaymentApi } from '../../services/rentPaymentApi';

// ==========================================
// THUNKS
// ==========================================

export const fetchRentPaymentsThunk = createAsyncThunk(
  'rentPayments/fetchRentPayments',
  async (params, { rejectWithValue }) => {
    try {
      const data = await rentPaymentApi.fetchRentPayments(params);
      return data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
    }
  }
);

export const fetchRentSummaryThunk = createAsyncThunk(
  'rentPayments/fetchRentSummary',
  async (month, { rejectWithValue }) => {
    try {
      const data = await rentPaymentApi.fetchRentSummary(month);
      return data.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
    }
  }
);

export const fetchPayableInvoicesThunk = createAsyncThunk(
  'rentPayments/fetchPayableInvoices',
  async (search = '', { rejectWithValue }) => {
    try {
      const data = await rentPaymentApi.fetchPayableInvoices(search);
      return data.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
    }
  }
);

export const fetchRentDetailThunk = createAsyncThunk(
  'rentPayments/fetchRentDetail',
  async (id, { rejectWithValue }) => {
    try {
      const data = await rentPaymentApi.fetchRentDetail(id);
      return data.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
    }
  }
);

export const recordPaymentThunk = createAsyncThunk(
  'rentPayments/recordPayment',
  async ({ invoiceId, payload }, { rejectWithValue }) => {
    try {
      const data = await rentPaymentApi.recordPayment(invoiceId, payload);
      return data;
    } catch (err) {
      const resData = err.response?.data || {};
      return rejectWithValue({
        message: resData.message || 'Lỗi khi ghi nhận thanh toán.',
        code: resData.code || null,
        current: resData.current || null,
        errors: resData.errors || null,
        status: err.response?.status || 500,
      });
    }
  }
);

export const fetchFieldLimitsThunk = createAsyncThunk(
  'rentPayments/fetchFieldLimits',
  async (_, { rejectWithValue }) => {
    try {
      const data = await rentPaymentApi.fetchFieldLimits();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ==========================================
// DEFAULT LIMITS (Fallback)
// ==========================================
const defaultFieldLimits = {
  search: { max: 100 },
  payment: {
    amount: { min: 0.01, max: 999999999999.99 },
    reference_code: { max: 100 },
    note: { max: 500 },
  },
  invoice: {
    title: { max: 255 },
    note: { max: 2000 },
    cancel_reason: { min: 3, max: 1000 },
  },
};

// Hàm lấy tháng hiện tại YYYY-MM
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// ==========================================
// INITIAL STATE
// ==========================================
const initialState = {
  items: [],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  },
  loading: false,
  error: null,

  summary: {
    month: getCurrentMonth(),
    total_collected: 0,
    total_collected_formatted: '0 VNĐ',
    total_outstanding: 0,
    total_outstanding_formatted: '0 VNĐ',
    paid_units: 0,
    overdue_units: 0,
    upcoming_units: 0,
    partial_units: 0,
  },
  summaryLoading: false,

  detail: null,
  detailLoading: false,

  payable: [],
  payableLoading: false,

  fieldLimits: defaultFieldLimits,

  filters: {
    month: getCurrentMonth(),
    status: '',
    search: '',
    sort: 'overdue_first',
    per_page: 10,
    page: 1,
  },

  recordLoading: false,
  recordError: null,
  recordFieldErrors: {},
  conflictData: null, // { type: 'STALE_VERSION' | 'DUPLICATE_SUSPECTED', message, current }
};

// ==========================================
// SLICE
// ==========================================
const rentPaymentsSlice = createSlice({
  name: 'rentPayments',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        // Reset về trang 1 nếu đổi bộ lọc chính (tháng, trạng thái, tìm kiếm, số dòng)
        page: action.payload.page !== undefined ? action.payload.page : 1,
      };
    },
    resetFilters: (state) => {
      state.filters = {
        month: getCurrentMonth(),
        status: '',
        search: '',
        sort: 'overdue_first',
        per_page: 10,
        page: 1,
      };
    },
    clearConflictData: (state) => {
      state.conflictData = null;
    },
    clearRecordError: (state) => {
      state.recordError = null;
      state.recordFieldErrors = {};
    },
    setDetail: (state, action) => {
      state.detail = action.payload;
    },
  },
  extraReducers: (builder) => {
    // 1. Fetch List
    builder
      .addCase(fetchRentPaymentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRentPaymentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.meta = action.payload.meta || state.meta;
      })
      .addCase(fetchRentPaymentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Không thể tải danh sách tiền thuê.';
      });

    // 2. Fetch Summary
    builder
      .addCase(fetchRentSummaryThunk.pending, (state) => {
        state.summaryLoading = true;
      })
      .addCase(fetchRentSummaryThunk.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload || state.summary;
      })
      .addCase(fetchRentSummaryThunk.rejected, (state) => {
        state.summaryLoading = false;
      });

    // 3. Fetch Payable
    builder
      .addCase(fetchPayableInvoicesThunk.pending, (state) => {
        state.payableLoading = true;
      })
      .addCase(fetchPayableInvoicesThunk.fulfilled, (state, action) => {
        state.payableLoading = false;
        state.payable = action.payload || [];
      })
      .addCase(fetchPayableInvoicesThunk.rejected, (state) => {
        state.payableLoading = false;
      });

    // 4. Fetch Detail
    builder
      .addCase(fetchRentDetailThunk.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchRentDetailThunk.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchRentDetailThunk.rejected, (state) => {
        state.detailLoading = false;
      });

    // 5. Record Payment
    builder
      .addCase(recordPaymentThunk.pending, (state) => {
        state.recordLoading = true;
        state.recordError = null;
        state.recordFieldErrors = {};
        state.conflictData = null;
      })
      .addCase(recordPaymentThunk.fulfilled, (state, action) => {
        state.recordLoading = false;
        // Cập nhật lại hóa đơn trong items nếu có
        const updatedInvoice = action.payload?.data?.invoice;
        if (updatedInvoice) {
          state.items = state.items.map((item) =>
            item.id === updatedInvoice.id ? updatedInvoice : item
          );
          if (state.detail && state.detail.id === updatedInvoice.id) {
            state.detail = updatedInvoice;
          }
        }
      })
      .addCase(recordPaymentThunk.rejected, (state, action) => {
        state.recordLoading = false;
        const err = action.payload || {};
        state.recordError = err.message || 'Lỗi khi ghi nhận thanh toán.';
        state.recordFieldErrors = err.errors || {};

        if (err.status === 409) {
          state.conflictData = {
            code: err.code,
            message: err.message,
            current: err.current,
          };
        }
      });

    // 6. Fetch Field Limits
    builder.addCase(fetchFieldLimitsThunk.fulfilled, (state, action) => {
      if (action.payload) {
        state.fieldLimits = action.payload;
      }
    });
  },
});

export const {
  setFilters,
  resetFilters,
  clearConflictData,
  clearRecordError,
  setDetail,
} = rentPaymentsSlice.actions;

export default rentPaymentsSlice.reducer;
