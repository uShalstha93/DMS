import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, UserCircle2, ChevronRight } from 'lucide-react';
import { logout } from '../store/authSlice';
import { markAllRead, markRead } from '../store/notificationsSlice';
import { dateTime } from '../utils/format';

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

export default function Topbar({ onMenu }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { items, unread } = useSelector((s) => s.notifications);
  const [panel, setPanel] = useState(null); // 'bell' | 'user' | null
  const wrap = useRef(null);
  useClickOutside(wrap, () => setPanel(null));

  const openNotification = (n) => {
    dispatch(markRead(n.id));
    setPanel(null);
    if (n.link) navigate(n.link);
  };

  const signOut = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-ink text-white px-4 lg:left-64">
      <button className="rounded-md p-2 hover:bg-paper lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="flex flex-row items-center text-sm text-white">
        <span className="font-medium">{user?.branch?.name}</span>
        <span className="mx-2"><ChevronRight size={16} /></span>
        <span>{user?.name} ({user?.role})</span>
      </div>

      <div ref={wrap} className="flex items-center gap-1">
        {/* Notifications */}
        <div className="relative">
          <button
            className="relative rounded-md p-2 hover:bg-gray-500"
            onClick={() => setPanel(panel === 'bell' ? null : 'bell')}
            aria-label={`Notifications, ${unread} unread`}
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-stamp px-1 text-center text-[11px] font-medium leading-[18px] text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {panel === 'bell' && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-rule bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
                <p className="text-sm font-semibold">Notifications</p>
                {unread > 0 && (
                  <button className="text-xs font-medium text-ledger hover:underline" onClick={() => dispatch(markAllRead())}>
                    Mark all as read
                  </button>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</li>}
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => openNotification(n)}
                      className={`block w-full border-b border-rule px-4 py-3 text-left last:border-0 hover:bg-paper ${!n.is_read ? 'bg-ledger-tint/40' : ''}`}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                      <p className="mt-1 text-xs text-slate-400">{dateTime(n.created_at)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User details */}
        <div className="relative">
          <button
            className="rounded-md p-2 hover:bg-gray-500"
            onClick={() => setPanel(panel === 'user' ? null : 'user')}
            aria-label="Your account"
          >
            <UserCircle2 size={22} />
          </button>
          {panel === 'user' && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-rule bg-ink p-4 shadow-lg">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <p className="mt-3 text-sm">
                Role: <span className="font-medium">{user?.role}</span>
              </p>
              <p className="text-sm">
                Branch: <span className="font-medium">{user?.branch?.name} ({user?.branch?.code})</span>
              </p>
              <p className="mt-2 text-xs text-slate-400">You can:</p>
              <ul className="mt-1 space-y-0.5 text-sm text-slate-300">
                {user?.permissions?.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>

        <button className="flex items-center gap-3 px-4 py-2 ml-2 text-sm bg-white rounded text-red-600 hover:bg-red-50 transition-colors" onClick={signOut}>
          <LogOut size={16} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
