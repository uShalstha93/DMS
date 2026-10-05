import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchNotifications = createAsyncThunk('notifications/list', async () => (await api.get('/notifications')).data);
export const markAllRead = createAsyncThunk('notifications/readAll', async () => { await api.post('/notifications/read-all'); });
export const markRead = createAsyncThunk('notifications/read', async (id) => { await api.post(`/notifications/${id}/read`); return id; });

const slice = createSlice({
  name: 'notifications',
  initialState: { items: [], unread: 0 },
  reducers: {
    addNotification(s, { payload }) {
      s.items.unshift(payload);
      s.unread += 1;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchNotifications.fulfilled, (s, { payload }) => { s.items = payload.items; s.unread = payload.unread; })
      .addCase(markAllRead.fulfilled, (s) => { s.items.forEach((n) => (n.is_read = 1)); s.unread = 0; })
      .addCase(markRead.fulfilled, (s, { payload }) => {
        const n = s.items.find((x) => x.id === payload);
        if (n && !n.is_read) { n.is_read = 1; s.unread = Math.max(0, s.unread - 1); }
      });
  },
});

export const { addNotification } = slice.actions;
export default slice.reducer;
