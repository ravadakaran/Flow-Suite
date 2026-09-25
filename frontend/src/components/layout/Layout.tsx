import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Building2, Shield,
  LogOut, Zap, ChevronRight, CreditCard, Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import NotificationDropdown from './NotificationDropdown';

const navItems = [
  { to: '/dashboard',           label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/projects',  label: 'Projects',  icon: FolderKanban },
  { to: '/dashboard/tasks',     label: 'Tasks',     icon: CheckSquare },
  { to: '/dashboard/customers', label: 'Customers', icon: Building2 },
  { to: '/dashboard/team',      label: 'Team',      icon: Users },
  { to: '/dashboard/audit',     label: 'Audit Log', icon: Shield },
  { to: '/dashboard/billing',   label: 'Billing',   icon: CreditCard },
  { to: '/dashboard/settings',  label: 'Settings',  icon: SettingsIcon },
];

export default function Layout() {
  const { logout, tenantSlug } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarW = collapsed ? 72 : 260;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col flex-shrink-0 relative z-20"
        style={{
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center gap-3 px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-sm)' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <span
                  className="font-bold text-base gradient-text whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #a5b4fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  FlowSuite
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace chip */}
        <AnimatePresence>
          {!collapsed && tenantSlug && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-2.5 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
            >
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Workspace</p>
              <p className="text-xs font-semibold truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {tenantSlug}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-tooltip={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0')
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={19} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div
          className="p-2 space-y-1 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border border-transparent',
              'hover:bg-rose-500/15 hover:border-rose-500/30',
              collapsed && 'justify-center'
            )}
            style={{ color: 'var(--color-text-muted)' }}
          >
            <LogOut size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-[var(--color-border)]"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronRight size={16} />
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content Area with Header ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--color-bg)' }}>
        {/* Top Header Bar */}
        <header
          className="h-14 flex items-center justify-between px-6 flex-shrink-0 z-10"
          style={{
            borderBottom: '1px solid var(--color-border-subtle)',
            background: 'var(--color-surface)',
          }}
        >
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {tenantSlug || 'Workspace'}
            </span>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <span className="text-slate-400 capitalize">
              App
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationDropdown />
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
