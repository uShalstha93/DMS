import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import documents from './documentsSlice';
import notifications from './notificationsSlice';
import chat from './chatSlice';
import members from './membersSlice';

export const store = configureStore({ reducer: { auth, documents, notifications, chat, members } });
