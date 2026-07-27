import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Collections from './pages/Collections';
import Entries from './pages/Entries';
import Templates from './pages/Templates';
import GlobalParts from './pages/GlobalParts';
import Menus from './pages/Menus';
import Media from './pages/Media';
import Ai from './pages/Ai';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="collections" element={<Collections />} />
          <Route path="entries" element={<Entries />} />
          <Route path="templates" element={<Templates />} />
          <Route path="global-parts" element={<GlobalParts />} />
          <Route path="menus" element={<Menus />} />
          <Route path="media" element={<Media />} />
          <Route path="ai" element={<Ai />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}
