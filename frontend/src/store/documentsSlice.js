import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { errorMessage } from '../api/axios';

// params: { status, q }. With no params, the last used filters are reused.
export const fetchDocuments = createAsyncThunk('documents/list', async (params, { getState, rejectWithValue }) => {
  try {
    const filters = params ?? getState().documents.filters;
    const { data } = await api.get('/documents', { params: filters });
    return { documents: data.documents, filters };
  } catch (e) {
    return rejectWithValue(errorMessage(e));
  }
});

export const fetchStats = createAsyncThunk('documents/stats', async () => (await api.get('/documents/stats')).data);

const slice = createSlice({
  name: 'documents',
  initialState: { items: [], filters: {}, stats: { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 }, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDocuments.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDocuments.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = payload.documents;
        s.filters = payload.filters;
      })
      .addCase(fetchDocuments.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchStats.fulfilled, (s, { payload }) => { s.stats = payload; });
  },
});

export default slice.reducer;
