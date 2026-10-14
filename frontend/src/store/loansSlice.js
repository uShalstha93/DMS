import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loansApi } from '../api/loans';

// How many loans are waiting for approval (shown on the Approvals menu and tab)
export const fetchLoanStats = createAsyncThunk('loans/stats', () => loansApi.stats());

const slice = createSlice({
  name: 'loans',
  initialState: { pending: 0, total: 0 },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchLoanStats.fulfilled, (s, { payload }) => {
      s.pending = payload?.pending ?? 0;
      s.total = payload?.total ?? 0;
    });
  },
});

export default slice.reducer;

