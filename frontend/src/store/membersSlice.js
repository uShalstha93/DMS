import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { membersApi } from '../api/members';

// How many members are waiting for approval (shown on the Approvals menu and tab)
export const fetchMemberStats = createAsyncThunk('members/stats', () => membersApi.stats());

const slice = createSlice({
  name: 'members',
  initialState: { pending: 0 },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMemberStats.fulfilled, (s, { payload }) => { s.pending = payload.PENDING; });
  },
});

export default slice.reducer;
