import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentList from './pages/DocumentList';
import DocumentForm from './pages/DocumentForm';
import DocumentDetail from './pages/DocumentDetail';
import DocumentPrint from './pages/DocumentPrint';
import Chat from './pages/Chat';
import Users from './pages/Users';
import Branches from './pages/Branches';
import ComingSoon from './pages/ComingSoon';
import MemberDetail from './pages/membership/MemberDetail';
import MemberRegistration from './pages/membership/MemberRegistration';
import ViewMemberDetail from './pages/membership/ViewMemberDetail';

function RequireAuth({ children }) {
  const token = useSelector((s) => s.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

// Hides a page from people who lack the permission
function Guard({ perm, children }) {
  const allowed = useSelector((s) => s.auth.user?.permissions?.includes(perm));
  return allowed ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />

        <Route path="documents" element={<DocumentList />} />
        <Route path="documents/new" element={<Guard perm="document.create"><DocumentForm /></Guard>} />
        <Route path="documents/:id" element={<DocumentDetail />} />
        <Route path="documents/:id/edit" element={<Guard perm="document.create"><DocumentForm /></Guard>} />
        <Route path="documents/:id/print" element={<Guard perm="document.print"><DocumentPrint /></Guard>} />

        <Route path="approvals" element={<Guard perm="document.approve"><DocumentList pendingOnly /></Guard>} />

        <Route path="chat" element={<Guard perm="chat.use"><Chat /></Guard>} />

        <Route path="membership" element={<Guard perm="membership.view"><MemberDetail /></Guard>} />
        <Route path="membership/new" element={<Guard perm="membership.create"><MemberRegistration /></Guard>} />
        <Route path="membership/:memberNo" element={<Guard perm="membership.view"><ViewMemberDetail /></Guard>} />

        <Route path="loan" element={<Navigate to="/loan/request" replace />} />
        <Route path="loan/request" element={<ComingSoon title="Loan Request" description="Requests raised by members." />} />
        <Route path="loan/application" element={<ComingSoon title="Loan Application" description="Applications under processing." />} />
        <Route path="loan/detail" element={<ComingSoon title="Loan Detail" description="Details of sanctioned loans." />} />
        <Route path="loan/rules" element={<ComingSoon title="Loan Rules" description="Details of loans rules." />} />
        <Route path="loan/pratigya" element={<ComingSoon title="Loan Pratigya" description="Details of sanctioned loans." />} />
        <Route path="loan/manjurinaama" element={<ComingSoon title="Loan Manjuri Naama" description="Details of sanctioned loans." />} />
        <Route path="loan/pariwarik-swikriti" element={<ComingSoon title="Loan Pariwarik Swikriti" description="Details of sanctioned loans." />} />
        <Route path="loan/bektigat-jamani" element={<ComingSoon title="Loan Bektigat Jamani" description="Details of sanctioned loans." />} />
        <Route path="loan/dhito-tamasuk" element={<ComingSoon title="Loan Dhito Tamasuk" description="Details of sanctioned loans." />} />
        <Route path="loan/personal-tamasuk" element={<ComingSoon title="Loan Personal Tamasuk" description="Details of sanctioned loans." />} />
        <Route path="loan/purpose" element={<ComingSoon title="Purpose Of Loan" description="Details of sanctioned loans." />} />
        <Route path="loan/malpot-application" element={<ComingSoon title="Loan Malpot Application" description="Details of sanctioned loans." />} />
        <Route path="loan/naapi-saakha" element={<ComingSoon title="Loan Naapi Saakha" description="Details of sanctioned loans." />} />
        <Route path="loan/analysis5c" element={<ComingSoon title="5C Analysis" description="Details of sanctioned loans." />} />
        <Route path="loan/mortgage-deed" element={<ComingSoon title="Loan Mortgage Deed" description="Details of sanctioned loans." />} />

        <Route path="location" element={<ComingSoon title="Locations" description="Manage locations and their details." />} />

        <Route path="users" element={<Guard perm="user.manage"><Users /></Guard>} />
        <Route path="branches" element={<Guard perm="branch.manage"><Branches /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
