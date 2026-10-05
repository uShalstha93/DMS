import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { fetchMe } from '../store/authSlice';
import { fetchNotifications } from '../store/notificationsSlice';
import { fetchStats } from '../store/documentsSlice';
import { fetchChatUsers } from '../store/chatSlice';
import { connectSocket, disconnectSocket } from '../socket';

export default function AppLayout() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const canChat = useSelector((s) => s.auth.user?.permissions?.includes('chat.use'));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMe());
    dispatch(fetchNotifications());
    dispatch(fetchStats());
    connectSocket(token, dispatch);
    return () => disconnectSocket();
  }, [token, dispatch]);

  useEffect(() => { if (canChat) dispatch(fetchChatUsers()); }, [canChat, dispatch]);

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Topbar onMenu={() => setMenuOpen(true)} />
      <main className="pt-14 lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
