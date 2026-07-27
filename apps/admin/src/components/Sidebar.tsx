import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Palette,
  Layout,
  Menu as MenuIcon,
  Image,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo-fondo-blanco.png';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/collections', icon: FolderOpen, label: 'Colecciones' },
  { to: '/entries', icon: FileText, label: 'Entradas' },
  { to: '/templates', icon: Palette, label: 'Templates' },
  { to: '/global-parts', icon: Layout, label: 'Partes Globales' },
  { to: '/menus', icon: MenuIcon, label: 'Menús' },
  { to: '/media', icon: Image, label: 'Media' },
  { to: '/ai', icon: Sparkles, label: 'IA' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-60 bg-primary min-h-screen flex flex-col">
      <div className="p-5 border-b border-white/10">
        <img src={logo} alt="RaCo CMS" className="h-8" />
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-secondary/15 text-secondary font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
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
