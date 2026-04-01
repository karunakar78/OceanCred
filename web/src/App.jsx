import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CompanyPage from './pages/CompanyPage';
import AdminPage from './pages/AdminPage';

function Protected({ role, children }) {
  const r = localStorage.getItem('role');
  if (r !== role) {
    if (role === 'admin') {
      window.alert('Unauthorized Access - Admins Only');
    } else {
      window.alert('Unauthorized Access');
    }
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/company"
        element={
          <Protected role="company">
            <CompanyPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
