import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard, FileText, FilePlus2, BadgeCheck, Landmark, ChevronDown,
  ClipboardCheck, MessageSquare, Users, MapPinned, Building2, Briefcase
} from 'lucide-react';
import Logo from './Logo';

/*
  Menu definition.
  - Normal item:      { to, label, icon, end?, perm?, badge? }
  - Item with submenu: { label, icon, base, children: [{ to, label, perm? }] }
    `base` is the URL prefix; the submenu opens by itself when you are inside it.
  - `perm` (optional) hides the item unless the user has that permission.
*/
const GROUPS = [
  {
    title: 'Workspace',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/documents', label: 'Documents', icon: FileText },
      // { to: '/documents/new', label: 'New document', icon: FilePlus2, perm: 'document.create' },
      { to: '/membership', label: 'Membership', icon: BadgeCheck, perm: 'membership.view' },
      {
        label: 'Loan',
        icon: Landmark,
        base: '/loan',
        children: [
          { to: '/loan/detail', label: 'Loan Detail' },
          { to: '/loan/request', label: 'Loan Request' },
          { to: '/loan/application', label: 'Loan Application' },
          { to: '/loan/rules', label: 'Loan Rules' },
          { to: '/loan/pratigya', label: 'Loan Pratigya' },
          { to: '/loan/manjurinaama', label: 'Manjuri Naama' },
          { to: '/loan/pariwarik-swikriti', label: 'Loan Pariwarik Swikriti' },
          { to: '/loan/bektigat-jamani', label: 'Bektigat Jamani' },
          { to: '/loan/dhito-tamasuk', label: 'Dhito Tamasuk' },
          { to: '/loan/personal-tamasuk', label: 'Personal Tamasuk' },
          { to: '/loan/purpose', label: 'Purpose Of Loan' },
          { to: '/loan/malpot-application', label: 'Malpot Application' },
          { to: '/loan/naapi-saakha', label: 'Naapi Saakha' },
          { to: '/loan/analysis5c', label: '5C Analysis' },
          { to: '/loan/mortgage-deed', label: 'Loan Mortgage Deed' },
        ],
      },
      { to: '/location', label: 'Locations', icon: MapPinned },
    ],
  },
  {
    title: 'Review',
    items: [{ to: '/approvals', label: 'Approvals', icon: ClipboardCheck, perm: 'document.approve', badge: 'pending' }],
  },
  {
    title: 'Team',
    items: [{ to: '/chat', label: 'Chat', icon: MessageSquare, perm: 'chat.use', badge: 'chat' }],
  },
  {
    title: 'Administration',
    items: [
      { to: '/staff', label: 'Staff', icon: Briefcase, perm: 'staff.view' },
      { to: '/users', label: 'Users and roles', icon: Users, perm: 'user.manage' },
      { to: '/branches', label: 'Branches', icon: Building2, perm: 'branch.manage' },
    ],
  },
];

const rowClass = (active) =>
  `flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? 'bg-ink-soft text-white shadow-[inset_3px_0_0_#0E7C66]' : 'text-slate-300 hover:bg-ink-soft hover:text-white'
  }`;

// A menu item that expands to show its sub-items
function SubMenu({ item, pathname, permissions, onClose }) {
  const children = item.children.filter((c) => !c.perm || permissions.includes(c.perm));
  const inside = pathname === item.base || pathname.startsWith(`${item.base}/`);
  const [open, setOpen] = useState(inside);
  const Icon = item.icon;
  const id = `submenu-${item.label.toLowerCase().replace(/\s+/g, '-')}`;

  // Open automatically when the user navigates into this section
  useEffect(() => { if (inside) setOpen(true); }, [inside]);

  if (!children.length) return null;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-ink-soft hover:text-white ${inside ? 'text-white' : 'text-slate-300'
          }`}
      >
        <Icon size={18} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul id={id} className="ml-[21px] mt-0.5 space-y-0.5 border-l border-ink-line pl-3">
          {children.map((c) => (
            <li key={c.to}>
              <NavLink
                to={c.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-1.5 text-sm transition-colors ${isActive ? 'bg-ink-soft font-medium text-white' : 'text-slate-300 hover:bg-ink-soft hover:text-white'
                  }`
                }
              >
                {c.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const permissions = useSelector((s) => s.auth.user?.permissions || []);
  const pending = useSelector((s) => s.documents.stats.PENDING);
  const unreadChat = useSelector((s) => s.chat.users.reduce((n, u) => n + u.unread, 0));
  const counts = { pending, chat: unreadChat };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink text-white transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo stays at the top; only the menu scrolls */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-line px-5">
          <Logo />
          <div className="leading-tight">
            <p className="text-base font-semibold">DMS</p>
            <p className="text-xs text-slate-400">Loan documents</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
          {GROUPS.map((group) => {
            const items = group.items.filter((i) => !i.perm || permissions.includes(i.perm));
            if (!items.length) return null;
            return (
              <div key={group.title} className="mb-5">
                <p className="mb-1 px-3 text-xs text-slate-400">{group.title}</p>
                <ul className="space-y-0.5">
                  {items.map((item) =>
                    item.children ? (
                      <SubMenu key={item.label} item={item} pathname={pathname} permissions={permissions} onClose={onClose} />
                    ) : (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={onClose}
                          className={({ isActive }) => {
                            // "Documents" must not stay highlighted on /documents/new
                            const active = item.to === '/documents' ? isActive && pathname !== '/documents/new' : isActive;
                            return rowClass(active);
                          }}
                        >
                          <item.icon size={18} />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && counts[item.badge] > 0 && (
                            <span className="rounded-full bg-ledger px-2 text-xs font-medium text-white">{counts[item.badge]}</span>
                          )}
                        </NavLink>
                      </li>
                    )
                  )}
                </ul>
              </div>
            );
          })}
        </nav>

        <text className='flex items-center justify-center text-sm text-slate-400'>&copy; {new Date().getFullYear()} Ushal Bindukar</text>
      </aside>
    </>
  );
}
