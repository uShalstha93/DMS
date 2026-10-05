import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import documents from './documentsSlice';
import notifications from './notificationsSlice';
import chat from './chatSlice';

export const store = configureStore({ reducer: { auth, documents, notifications, chat } });
