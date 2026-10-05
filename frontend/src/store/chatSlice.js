import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchChatUsers = createAsyncThunk('chat/users', async () => (await api.get('/chat/users')).data.users);
export const fetchMessages = createAsyncThunk('chat/messages', async (userId) => {
  const { data } = await api.get(`/chat/${userId}`);
  return { userId, messages: data.messages };
});
export const sendMessage = createAsyncThunk('chat/send', async ({ userId, body }) => {
  await api.post(`/chat/${userId}`, { body }); // the message returns through the socket
});

export const markConversationRead = createAsyncThunk('chat/read', async (userId) => {
  await api.post(`/chat/${userId}/read`);
});

const slice = createSlice({
  name: 'chat',
  initialState: { users: [], activeId: null, messages: {}, online: [], typing: null },
  reducers: {
    setActive(s, { payload }) {
      s.activeId = payload;
      const u = s.users.find((x) => x.id === payload);
      if (u) u.unread = 0;
    },
    setOnline(s, { payload }) { s.online = payload; },
    setTyping(s, { payload }) { s.typing = payload; },
    clearTyping(s) { s.typing = null; },
    receiveMessage(s, { payload: m }) {
      const me = JSON.parse(localStorage.getItem('dms_user') || '{}').id;
      const otherId = m.sender_id === me ? m.receiver_id : m.sender_id;
      const list = (s.messages[otherId] ||= []);
      if (!list.some((x) => x.id === m.id)) list.push(m);
      if (m.sender_id !== me) {
        if (s.typing === m.sender_id) s.typing = null;
        // Not looking at this conversation: show it as unread
        if (s.activeId !== otherId) {
          const u = s.users.find((x) => x.id === otherId);
          if (u) u.unread += 1;
        }
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchChatUsers.fulfilled, (s, { payload }) => { s.users = payload; })
      .addCase(fetchMessages.fulfilled, (s, { payload }) => { s.messages[payload.userId] = payload.messages; });
  },
});

export const { setActive, setOnline, setTyping, clearTyping, receiveMessage } = slice.actions;
export default slice.reducer;
