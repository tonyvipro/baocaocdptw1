import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contractExtensionApi } from '../../services/contractExtensionApi';

// Thunks
export const checkEligibilityThunk = createAsyncThunk(
  'contractExtension/checkEligibility',
  async (contractId, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.checkEligibility(contractId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchDraftThunk = createAsyncThunk(
  'contractExtension/fetchDraft',
  async (contractId, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.getDraft(contractId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const saveDraftThunk = createAsyncThunk(
  'contractExtension/saveDraft',
  async ({ contractId, payload, extensionId }, { rejectWithValue }) => {
    try {
      let data;
      if (extensionId) {
        data = await contractExtensionApi.updateDraft(extensionId, payload);
      } else {
        data = await contractExtensionApi.saveDraft(contractId, payload);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const submitExtensionThunk = createAsyncThunk(
  'contractExtension/submitExtension',
  async ({ extensionId, payload }, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.submitExtension(extensionId, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const uploadDocumentsThunk = createAsyncThunk(
  'contractExtension/uploadDocuments',
  async ({ extensionId, files }, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.uploadDocuments(extensionId, files);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteDocumentThunk = createAsyncThunk(
  'contractExtension/deleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.deleteDocument(documentId);
      return { documentId, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchHistoryThunk = createAsyncThunk(
  'contractExtension/fetchHistory',
  async ({ contractId, page = 1 }, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.getHistoryByContract(contractId, page);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const approveExtensionThunk = createAsyncThunk(
  'contractExtension/approveExtension',
  async (extensionId, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.approveExtension(extensionId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const rejectExtensionThunk = createAsyncThunk(
  'contractExtension/rejectExtension',
  async ({ extensionId, payload }, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.rejectExtension(extensionId, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const cancelExtensionThunk = createAsyncThunk(
  'contractExtension/cancelExtension',
  async ({ extensionId, payload }, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.cancelExtension(extensionId, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteDraftThunk = createAsyncThunk(
  'contractExtension/deleteDraft',
  async (extensionId, { rejectWithValue }) => {
    try {
      const data = await contractExtensionApi.deleteDraft(extensionId);
      return { extensionId, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  eligibility: null,
  activeDraft: null,
  documents: [],
  history: [],
  historyMeta: null,
  loading: false,
  saving: false,
  submitting: false,
  uploading: false,
  error: null,
  successMessage: null,
};

const contractExtensionSlice = createSlice({
  name: 'contractExtension',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetDraftState: (state) => {
      state.activeDraft = null;
      state.documents = [];
      state.error = null;
      state.successMessage = null;
    },
    setDraftField: (state, action) => {
      if (!state.activeDraft) {
        state.activeDraft = {};
      }
      state.activeDraft = {
        ...state.activeDraft,
        [action.payload.field]: action.payload.value
      };
    }
  },
  extraReducers: (builder) => {
    // checkEligibility
    builder
      .addCase(checkEligibilityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkEligibilityThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.eligibility = action.payload.data;
        if (action.payload.data?.current_draft) {
          state.activeDraft = action.payload.data.current_draft;
          state.documents = action.payload.data.current_draft.documents || [];
        }
      })
      .addCase(checkEligibilityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchDraft
    builder
      .addCase(fetchDraftThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.activeDraft = action.payload.data;
          state.documents = action.payload.data.documents || [];
        }
      })
      .addCase(fetchDraftThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // saveDraft
    builder
      .addCase(saveDraftThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(saveDraftThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.activeDraft = action.payload.data;
        state.documents = action.payload.data?.documents || state.documents;
        state.successMessage = action.payload.message || 'Đã lưu bản nháp thành công!';
      })
      .addCase(saveDraftThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // submitExtension
    builder
      .addCase(submitExtensionThunk.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(submitExtensionThunk.fulfilled, (state, action) => {
        state.submitting = false;
        state.activeDraft = action.payload.data;
        state.successMessage = action.payload.message || 'Đã gửi yêu cầu gia hạn thành công!';
      })
      .addCase(submitExtensionThunk.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });

    // uploadDocuments
    builder
      .addCase(uploadDocumentsThunk.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadDocumentsThunk.fulfilled, (state, action) => {
        state.uploading = false;
        const newDocs = action.payload.data || [];
        state.documents = [...state.documents, ...newDocs];
        state.successMessage = action.payload.message || 'Tải tài liệu lên thành công!';
      })
      .addCase(uploadDocumentsThunk.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });

    // deleteDocument
    builder
      .addCase(deleteDocumentThunk.fulfilled, (state, action) => {
        state.documents = state.documents.filter(doc => doc.id !== action.payload.documentId);
        state.successMessage = action.payload.message || 'Đã xóa tài liệu đính kèm.';
      })
      .addCase(deleteDocumentThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // fetchHistory
    builder
      .addCase(fetchHistoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHistoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.data || [];
        state.historyMeta = action.payload.meta || null;
      })
      .addCase(fetchHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // approveExtension
    builder
      .addCase(approveExtensionThunk.fulfilled, (state, action) => {
        state.successMessage = action.payload.message || 'Phê duyệt gia hạn hợp đồng thành công!';
      })
      .addCase(approveExtensionThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // rejectExtension
    builder
      .addCase(rejectExtensionThunk.fulfilled, (state, action) => {
        state.successMessage = action.payload.message || 'Đã từ chối yêu cầu gia hạn.';
      })
      .addCase(rejectExtensionThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // cancelExtension
    builder
      .addCase(cancelExtensionThunk.fulfilled, (state, action) => {
        state.successMessage = action.payload.message || 'Đã rút yêu cầu gia hạn.';
      })
      .addCase(cancelExtensionThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // deleteDraft
    builder
      .addCase(deleteDraftThunk.fulfilled, (state) => {
        state.activeDraft = null;
        state.documents = [];
        state.successMessage = 'Đã xóa bản nháp gia hạn.';
      })
      .addCase(deleteDraftThunk.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { clearMessages, resetDraftState, setDraftField } = contractExtensionSlice.actions;
export default contractExtensionSlice.reducer;
