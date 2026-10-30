import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import depositService from '../../services/depositService';

export const fetchDepositsThunk = createAsyncThunk(
  'deposits/fetchDeposits',
  async (params, { rejectWithValue }) => {
    try {
      return await depositService.fetchDeposits(params);
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || 'Không thể tải danh sách quản lý tiền cọc.',
        status: err.response?.status,
      });
    }
  }
);

export const fetchDepositSummaryThunk = createAsyncThunk(
  'deposits/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const res = await depositService.fetchSummary();
      return res.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || 'Không thể tải thống kê tiền cọc.',
        status: err.response?.status,
      });
    }
  }
);

export const fetchDepositDetailThunk = createAsyncThunk(
  'deposits/fetchDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await depositService.fetchDepositDetail(id);
      return res.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || 'Không thể tải chi tiết khoản tiền cọc.',
        status: err.response?.status,
      });
    }
  }
);

export const collectDepositThunk = createAsyncThunk(
  'deposits/collect',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await depositService.collectDeposit(id, payload);
    } catch (err) {
      const resData = err.response?.data || {};
      return rejectWithValue({
        message: resData.message || 'Lỗi khi ghi nhận thu tiền cọc.',
        code: resData.code || null,
        current_data: resData.current_data || null,
        errors: resData.errors || null,
        status: err.response?.status || 500,
      });
    }
  }
);

export const refundDepositThunk = createAsyncThunk(
  'deposits/refund',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await depositService.refundDeposit(id, payload);
    } catch (err) {
      const resData = err.response?.data || {};
      return rejectWithValue({
        message: resData.message || 'Lỗi khi ghi nhận hoàn trả / khấu trừ tiền cọc.',
        code: resData.code || null,
        current_data: resData.current_data || null,
        errors: resData.errors || null,
        status: err.response?.status || 500,
      });
    }
  }
);

export const updateDepositThunk = createAsyncThunk(
  'deposits/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await depositService.updateDeposit(id, payload);
    } catch (err) {
      const resData = err.response?.data || {};
      return rejectWithValue({
        message: resData.message || 'Lỗi khi cập nhật thông tin tiền cọc.',
        code: resData.code || null,
        current_data: resData.current_data || null,
        errors: resData.errors || null,
        status: err.response?.status || 500,
      });
    }
  }
);

export const voidDepositMovementThunk = createAsyncThunk(
  'deposits/voidMovement',
  async ({ transactionId, reason }, { rejectWithValue }) => {
    try {
      return await depositService.voidMovement(transactionId, reason);
    } catch (err) {
      const resData = err.response?.data || {};
      return rejectWithValue({
        message: resData.message || 'Không thể hủy giao dịch tiền cọc.',
        code: resData.code || null,
        errors: resData.errors || null,
        status: err.response?.status || 500,
      });
    }
  }
);

const initialState = {
  items: [],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  },
  loading: false,
  error: null,

  summary: {
    total_held_amount: 0,
    collected_count: 0,
    holding_count: 0,
    refund_due_count: 0,
    refund_due_amount: 0,
    unpaid_count: 0,
    refunded_count: 0,
    total_deposits: 0,
  },
  summaryLoading: false,

  detail: null,
  detailLoading: false,
  detailError: null,

  filters: {
    search: '',
    status: 'all',
    from_date: '',
    to_date: '',
    end_from: '',
    end_to: '',
    sort: 'refund_due_first',
    per_page: 10,
    page: 1,
  },

  submitting: false,
  submitError: null,
  fieldErrors: {},
  conflictData: null,
};

const depositsSlice = createSlice({
  name: 'deposits',
  initialState,
  reducers: {
    setDepositFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        page: action.payload.page !== undefined ? action.payload.page : 1,
      };
    },
    resetDepositFilters: (state) => {
      state.filters = {
        search: '',
        status: 'all',
        from_date: '',
        to_date: '',
        end_from: '',
        end_to: '',
        sort: 'refund_due_first',
        per_page: 10,
        page: 1,
      };
    },
    clearDepositFormState: (state) => {
      state.submitError = null;
      state.fieldErrors = {};
      state.conflictData = null;
    },
    setDepositDetail: (state, action) => {
      state.detail = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepositsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepositsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.meta = action.payload.meta || state.meta;
      })
      .addCase(fetchDepositsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Không thể tải danh sách quản lý tiền cọc.';
      });

    builder
      .addCase(fetchDepositSummaryThunk.pending, (state) => {
        state.summaryLoading = true;
      })
      .addCase(fetchDepositSummaryThunk.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload || state.summary;
      })
      .addCase(fetchDepositSummaryThunk.rejected, (state) => {
        state.summaryLoading = false;
      });

    builder
      .addCase(fetchDepositDetailThunk.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchDepositDetailThunk.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchDepositDetailThunk.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload?.message || 'Không thể tải chi tiết khoản tiền cọc.';
      });

    const handleMutationPending = (state) => {
      state.submitting = true;
      state.submitError = null;
      state.fieldErrors = {};
      state.conflictData = null;
    };

    const handleMutationRejected = (state, action) => {
      state.submitting = false;
      const err = action.payload || {};
      state.submitError = err.message || 'Thao tác không thành công.';
      state.fieldErrors = err.errors || {};
      if (err.status === 409) {
        state.conflictData = {
          code: err.code,
          message: err.message,
          current_data: err.current_data,
        };
      }
    };

    const syncUpdatedDepositInState = (state, updatedDeposit) => {
      if (!updatedDeposit) return;
      state.items = state.items.map((item) =>
        item.id === updatedDeposit.id ? { ...item, ...updatedDeposit } : item
      );
      if (state.detail && state.detail.id === updatedDeposit.id) {
        state.detail = updatedDeposit;
      }
    };

    builder
      .addCase(collectDepositThunk.pending, handleMutationPending)
      .addCase(collectDepositThunk.fulfilled, (state, action) => {
        state.submitting = false;
        syncUpdatedDepositInState(state, action.payload?.data?.deposit);
      })
      .addCase(collectDepositThunk.rejected, handleMutationRejected);

    builder
      .addCase(refundDepositThunk.pending, handleMutationPending)
      .addCase(refundDepositThunk.fulfilled, (state, action) => {
        state.submitting = false;
        syncUpdatedDepositInState(state, action.payload?.data?.deposit);
      })
      .addCase(refundDepositThunk.rejected, handleMutationRejected);

    builder
      .addCase(updateDepositThunk.pending, handleMutationPending)
      .addCase(updateDepositThunk.fulfilled, (state, action) => {
        state.submitting = false;
        syncUpdatedDepositInState(state, action.payload?.data);
      })
      .addCase(updateDepositThunk.rejected, handleMutationRejected);

    builder
      .addCase(voidDepositMovementThunk.pending, handleMutationPending)
      .addCase(voidDepositMovementThunk.fulfilled, (state, action) => {
        state.submitting = false;
        syncUpdatedDepositInState(state, action.payload?.data);
      })
      .addCase(voidDepositMovementThunk.rejected, handleMutationRejected);
  },
});

export const {
  setDepositFilters,
  resetDepositFilters,
  clearDepositFormState,
  setDepositDetail,
} = depositsSlice.actions;

export default depositsSlice.reducer;

