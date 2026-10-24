import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Collections from './pages/Collections';
import Entries from './pages/Entries';
import FieldGroups from './pages/FieldGroups';
import FieldGroupEditor from './pages/FieldGroupEditor';
import Taxonomies from './pages/Taxonomies';
import TaxonomyTerms from './pages/TaxonomyTerms';
import Menus from './pages/Menus';
import Media from './pages/Media';

// El editor arrastra Tiptap, se carga solo cuando se abre una entrada
const EntryEditor = lazy(() => import('./pages/EntryEditor'));
// Usa el compilador de Tailwind en vivo para la vista previa
const SiteSettings = lazy(() => import('./pages/SiteSettings'));
// Página a pantalla completa, fuera del layout del panel
const Preview = lazy(() => import('./pages/Preview'));
// Vista previa real del header/footer (compilador de Tailwind en vivo)
const GlobalParts = lazy(() => import('./pages/GlobalParts'));
const Templates = lazy(() => import('./pages/Templates'));
// Convierte la receta de la IA con @raco/blocks
const Ai = lazy(() => import('./pages/Ai'));

const loading = <p className="text-sm text-tertiary">Cargando...</p>;

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/preview/:collectionId/:entryId"
          element={
            <ProtectedRoute>
              <Suspense fallback={loading}>
                <Preview />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pages" element={<Navigate to="/collections/pages" replace />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:collectionId" element={<Entries />} />
          <Route
            path="collections/:collectionId/:entryId"
            element={
              <Suspense fallback={loading}>
                <EntryEditor />
              </Suspense>
            }
          />
          <Route path="field-groups" element={<FieldGroups />} />
          <Route path="field-groups/:groupId" element={<FieldGroupEditor />} />
          <Route path="taxonomies" element={<Taxonomies />} />
          <Route path="taxonomies/:taxonomyId" element={<TaxonomyTerms />} />
          <Route
            path="templates"
            element={
              <Suspense fallback={loading}>
                <Templates />
              </Suspense>
            }
          />
          <Route
            path="global-parts"
            element={
              <Suspense fallback={loading}>
                <GlobalParts />
              </Suspense>
            }
          />
          <Route path="menus" element={<Menus />} />
          <Route path="media" element={<Media />} />
          <Route
            path="ai"
            element={
              <Suspense fallback={loading}>
                <Ai />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={loading}>
                <SiteSettings />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}
