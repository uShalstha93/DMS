import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { fetchMe } from '../store/authSlice';
import { fetchNotifications } from '../store/notificationsSlice';
import { fetchStats } from '../store/documentsSlice';
import { fetchChatUsers } from '../store/chatSlice';
import { fetchMemberStats } from '../store/membersSlice';
import { fetchLoanStats } from '../store/loansSlice';
import { connectSocket, disconnectSocket } from '../socket';

export default function AppLayout() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const canChat = useSelector((s) => s.auth.user?.permissions?.includes('chat.use'));
  const canApproveMembers = useSelector((s) => s.auth.user?.permissions?.includes('membership.approve'));
  const canApproveLoans = useSelector((s) => {
    const p = s.auth.user?.permissions || [];
    return p.includes('loan.approve') || p.includes('loanrequest.approve') || p.includes('loanapplication.approve') || p.includes('loanrule.approve');
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMe());
    dispatch(fetchNotifications());
    dispatch(fetchStats());
    connectSocket(token, dispatch);
    return () => disconnectSocket();
  }, [token, dispatch]);

  useEffect(() => { if (canChat) dispatch(fetchChatUsers()); }, [canChat, dispatch]);
  useEffect(() => { if (canApproveMembers) dispatch(fetchMemberStats()); }, [canApproveMembers, dispatch]);
  useEffect(() => { if (canApproveLoans) dispatch(fetchLoanStats()); }, [canApproveLoans, dispatch]);

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
