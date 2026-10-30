import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { invoiceApi } from '../../services/invoiceApi';

// ==========================================
// THUNKS
// ==========================================

export const fetchInvoicesThunk = createAsyncThunk(
  'invoice/fetchInvoices',
  async (params, { rejectWithValue }) => {
    try {
      const data = await invoiceApi.fetchInvoices(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchInvoiceDetailThunk = createAsyncThunk(
  'invoice/fetchInvoiceDetail',
  async (id, { rejectWithValue }) => {
    try {
      const data = await invoiceApi.fetchInvoiceDetail(id);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createInvoiceThunk = createAsyncThunk(
  'invoice/createInvoice',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await invoiceApi.createInvoice(payload);
      return data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || 'Lỗi khi tạo hóa đơn.',
        errors: err.response?.data?.errors || null,
        status: err.response?.status,
      });
    }
  }
);

export const updateInvoiceThunk = createAsyncThunk(
  'invoice/updateInvoice',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await invoiceApi.updateInvoice(id, payload);
      return data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || 'Lỗi khi cập nhật hóa đơn.',
        errors: err.response?.data?.errors || null,
        status: err.response?.status,
      });
    }
  }
);

export const cancelInvoiceThunk = createAsyncThunk(
  'invoice/cancelInvoice',
  async ({ id, cancelReason }, { rejectWithValue }) => {
    try {
      const data = await invoiceApi.cancelInvoice(id, cancelReason);
      return data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || 'Lỗi khi hủy hóa đơn.',
        errors: err.response?.data?.errors || null,
        status: err.response?.status,
      });
    }
  }
);

export const sendInvoiceEmailThunk = createAsyncThunk(
  'invoice/sendInvoiceEmail',
  async ({ id, email }, { rejectWithValue }) => {
    try {
      const data = await invoiceApi.sendEmail(id, email);
      return data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || 'Không thể gửi email hóa đơn.',
        status: err.response?.status,
      });
    }
  }
);

export const downloadInvoicePdfThunk = createAsyncThunk(
  'invoice/downloadInvoicePdf',
  async ({ id, invoiceNo }, { rejectWithValue }) => {
    try {
      await invoiceApi.downloadPdf(id, invoiceNo);
      return { id, invoiceNo };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi tải file PDF.');
    }
  }
);

// Dành cho khách hàng
export const fetchMyInvoicesThunk = createAsyncThunk(
  'invoice/fetchMyInvoices',
  async (params, { rejectWithValue }) => {
    try {
      const data = await invoiceApi.fetchMyInvoices(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchMyInvoiceDetailThunk = createAsyncThunk(
  'invoice/fetchMyInvoiceDetail',
  async (id, { rejectWithValue }) => {
    try {
      const data = await invoiceApi.fetchMyInvoiceDetail(id);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ==========================================
// SLICE
// ==========================================

const initialState = {
  invoicesList: [],
  pagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  },
  filters: {
    search: '',
    status: '',
    type: '',
    contract_id: '',
    due_from: '',
    due_to: '',
  },
  detail: null,
  myInvoicesList: [],
  myPagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  },
  myDetail: null,
  loading: false,
  submitting: false,
  sendingEmail: false,
  downloadingPdf: false,
  error: null,
  fieldErrors: {},
  successMessage: null,
};

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        search: '',
        status: '',
        type: '',
        contract_id: '',
        due_from: '',
        due_to: '',
      };
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    clearDetail: (state) => {
      state.detail = null;
    },
    clearMessages: (state) => {
      state.error = null;
      state.fieldErrors = {};
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // 1. Fetch Invoices List
    builder
      .addCase(fetchInvoicesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoicesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.invoicesList = action.payload.data || [];
        if (action.payload.meta) {
          state.pagination = {
            currentPage: action.payload.meta.current_page,
            lastPage: action.payload.meta.last_page,
            perPage: action.payload.meta.per_page,
            total: action.payload.meta.total,
          };
        }
      })
      .addCase(fetchInvoicesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // 2. Fetch Invoice Detail
    builder
      .addCase(fetchInvoiceDetailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceDetailThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
      })
      .addCase(fetchInvoiceDetailThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // 3. Create Invoice
    builder
      .addCase(createInvoiceThunk.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createInvoiceThunk.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = action.payload.message || 'Lập hóa đơn thanh toán thành công!';
        if (action.payload.data) {
          state.invoicesList = [action.payload.data, ...state.invoicesList];
        }
      })
      .addCase(createInvoiceThunk.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload?.message || 'Lỗi khi lập hóa đơn.';
        state.fieldErrors = action.payload?.errors || {};
      });

    // 4. Update Invoice
    builder
      .addCase(updateInvoiceThunk.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateInvoiceThunk.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = action.payload.message || 'Cập nhật hóa đơn thành công!';
        state.detail = action.payload.data;
        // Cập nhật lại trong list
        const idx = state.invoicesList.findIndex((i) => i.id === action.payload.data?.id);
        if (idx !== -1) {
          state.invoicesList[idx] = { ...state.invoicesList[idx], ...action.payload.data };
        }
      })
      .addCase(updateInvoiceThunk.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload?.message || 'Lỗi khi cập nhật hóa đơn.';
        state.fieldErrors = action.payload?.errors || {};
      });

    // 5. Cancel Invoice
    builder
      .addCase(cancelInvoiceThunk.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(cancelInvoiceThunk.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = action.payload.message || 'Hủy hóa đơn thành công!';
        if (state.detail && state.detail.id === action.payload.data?.id) {
          state.detail = action.payload.data;
        }
        const idx = state.invoicesList.findIndex((i) => i.id === action.payload.data?.id);
        if (idx !== -1) {
          state.invoicesList[idx] = { ...state.invoicesList[idx], ...action.payload.data };
        }
      })
      .addCase(cancelInvoiceThunk.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload?.message || 'Lỗi khi hủy hóa đơn.';
      });

    // 6. Send Email
    builder
      .addCase(sendInvoiceEmailThunk.pending, (state) => {
        state.sendingEmail = true;
        state.error = null;
      })
      .addCase(sendInvoiceEmailThunk.fulfilled, (state, action) => {
        state.sendingEmail = false;
        state.successMessage = action.payload.message || 'Đã gửi hóa đơn thanh toán đến email của khách hàng!';
        if (state.detail) {
          state.detail.email_sent_at = action.payload.data?.email_sent_at;
        }
      })
      .addCase(sendInvoiceEmailThunk.rejected, (state, action) => {
        state.sendingEmail = false;
        state.error = action.payload?.message || 'Không thể gửi email hóa đơn.';
      });

    // 7. Download PDF
    builder
      .addCase(downloadInvoicePdfThunk.pending, (state) => {
        state.downloadingPdf = true;
      })
      .addCase(downloadInvoicePdfThunk.fulfilled, (state) => {
        state.downloadingPdf = false;
      })
      .addCase(downloadInvoicePdfThunk.rejected, (state, action) => {
        state.downloadingPdf = false;
        state.error = action.payload;
      });

    // 8. Fetch My Invoices
    builder
      .addCase(fetchMyInvoicesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyInvoicesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.myInvoicesList = action.payload.data || [];
        if (action.payload.meta) {
          state.myPagination = {
            currentPage: action.payload.meta.current_page,
            lastPage: action.payload.meta.last_page,
            perPage: action.payload.meta.per_page,
            total: action.payload.meta.total,
          };
        }
      })
      .addCase(fetchMyInvoicesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // 9. Fetch My Invoice Detail
    builder
      .addCase(fetchMyInvoiceDetailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyInvoiceDetailThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.myDetail = action.payload;
      })
      .addCase(fetchMyInvoiceDetailThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, resetFilters, setPage, clearDetail, clearMessages } = invoiceSlice.actions;
export default invoiceSlice.reducer;
