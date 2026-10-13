import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Palette,
  Layout,
  Menu as MenuIcon,
  Image,
  Sparkles,
  Tags,
  Puzzle,
  LogOut,
  ChevronDown,
  File,
  FolderOpen,
  Settings,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { onStructureChanged } from '../lib/events';
import logo from '../assets/logo-fondo-blanco.png';

interface Collection {
  id: string;
  name: string;
  isNative?: boolean;
}

interface Taxonomy {
  id: string;
  name: string;
  collectionId: string;
}

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [openAcf, setOpenAcf] = useState(true);
  const [openCol, setOpenCol] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      api.get<Collection[]>('/collections').then(setCollections).catch(() => {});
      api.get<Taxonomy[]>('/taxonomies').then(setTaxonomies).catch(() => {});
    };
    load();
    return onStructureChanged(load);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-secondary/15 text-secondary font-medium'
        : 'text-white/70 hover:text-white hover:bg-white/5'
    }`;

  return (
    <aside className="w-60 bg-primary min-h-screen flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-white/10">
        <img src={logo} alt="RaCo CMS" className="h-8" />
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/collections/pages" className={({ isActive }) => linkClass(isActive)}>
          <File size={18} />
          Páginas
        </NavLink>

        {/* --- ACF Module --- */}
        <div>
          <button
            onClick={() => setOpenAcf(!openAcf)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 w-full"
          >
            <Puzzle size={18} />
            Tipos de Contenido
            <ChevronDown size={14} className={`ml-auto transition-transform ${openAcf ? 'rotate-180' : ''}`} />
          </button>
          {openAcf && (
            <div className="ml-4 space-y-0.5 border-l border-white/10 ml-6 pl-2">
              <NavLink to="/collections" end className={({ isActive }) => linkClass(isActive)}>
                <FolderOpen size={16} />
                Colecciones
              </NavLink>
              <NavLink to="/field-groups" className={({ isActive }) => linkClass(isActive)}>
                <Palette size={16} />
                Grupos de Campos
              </NavLink>
              <NavLink to="/taxonomies" end className={({ isActive }) => linkClass(isActive)}>
                <Tags size={16} />
                Taxonomías
              </NavLink>
            </div>
          )}
        </div>

        {/* --- Colecciones dinámicas en menú --- */}
        {/* Las nativas (Páginas) ya tienen su acceso fijo arriba */}
        {collections.filter((col) => !col.isNative).map((col) => {
          const colTaxonomies = taxonomies.filter((t) => t.collectionId === col.id);
          const isOpen = openCol === col.id;

          return (
            <div key={col.id}>
              <button
                onClick={() => setOpenCol(isOpen ? null : col.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 w-full"
              >
                <FileText size={18} />
                {col.name}
                <ChevronDown size={14} className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="ml-6 pl-2 border-l border-white/10 space-y-0.5">
                  <NavLink
                    to={`/collections/${col.id}`}
                    className={({ isActive }) => linkClass(isActive)}
                  >
                    <FileText size={15} />
                    Entradas
                  </NavLink>
                  {colTaxonomies.map((tax) => (
                    <NavLink
                      key={tax.id}
                      to={`/taxonomies/${tax.id}`}
                      className={({ isActive }) => linkClass(isActive)}
                    >
                      <Tags size={15} />
                      {tax.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <NavLink to="/templates" className={({ isActive }) => linkClass(isActive)}>
          <Layout size={18} />
          Templates
        </NavLink>

        <NavLink to="/global-parts" className={({ isActive }) => linkClass(isActive)}>
          <Layout size={18} />
          Partes Globales
        </NavLink>

        <NavLink to="/menus" className={({ isActive }) => linkClass(isActive)}>
          <MenuIcon size={18} />
          Menús
        </NavLink>

        <NavLink to="/media" className={({ isActive }) => linkClass(isActive)}>
          <Image size={18} />
          Media
        </NavLink>

        <NavLink to="/ai" className={({ isActive }) => linkClass(isActive)}>
          <Sparkles size={18} />
          IA
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
          <Settings size={18} />
          Diseño del sitio
        </NavLink>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors w-full"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
