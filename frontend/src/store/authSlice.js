import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { errorMessage } from '../api/axios';

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('dms_user')); } catch { return null; }
};

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  } catch (e) {
    return rejectWithValue(errorMessage(e, 'Unable to sign in. Try again'));
  }
});

// Refreshes the user's permissions from the server
export const fetchMe = createAsyncThunk('auth/me', async () => (await api.get('/auth/me')).data.user);

const slice = createSlice({
  name: 'auth',
  initialState: { token: localStorage.getItem('dms_token'), user: readUser(), loading: false, error: null },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('dms_token');
      localStorage.removeItem('dms_user');
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.token = payload.token;
        s.user = payload.user;
        localStorage.setItem('dms_token', payload.token);
        localStorage.setItem('dms_user', JSON.stringify(payload.user));
      })
      .addCase(login.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        s.user = payload;
        localStorage.setItem('dms_user', JSON.stringify(payload));
      });
  },
});

export const { logout } = slice.actions;
export const selectCan = (permission) => (state) => !!state.auth.user?.permissions?.includes(permission);
export default slice.reducer;
