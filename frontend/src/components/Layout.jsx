import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import logo from '../assets/logo.png';
import {
  LayoutDashboard,
  ShoppingCart,
  Timer,
  Package,
  Utensils,
  Wrench,
  Truck,
  DollarSign,
  Users,
  UserCheck,
  CreditCard,
  RefreshCw,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

export default function Layout({ children, currentView, setCurrentView }) {
  const { user, logout, theme, toggleTheme, currentShift, notifications, clearNotifications } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'pos', name: 'Retail POS', icon: ShoppingCart, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'shift', name: 'Shift Control', icon: Timer, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'inventory', name: 'Inventory', icon: Package, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'hospitality', name: 'Hospitality & KDS', icon: Utensils, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'repairs', name: 'Repairs & Liability', icon: Wrench, roles: ['Admin', 'Manager', 'Technician'] },
    { id: 'deliveries', name: 'Deliveries', icon: Truck, roles: ['Admin', 'Manager', 'Driver'] },
    { id: 'hp', name: 'Hire Purchase', icon: CreditCard, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'tradein', name: 'Trade-In Valuation', icon: RefreshCw, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'staff', name: 'Staff Directory', icon: UserCheck, roles: ['Admin', 'Manager'] },
    { id: 'customers', name: 'Customers & Loyalty', icon: Users, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'expenses', name: 'Expenses', icon: DollarSign, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'reports', name: 'Reports Panel', icon: BarChart3, roles: ['Admin', 'Manager'] },
    { id: 'settings', name: 'Settings', icon: Settings, roles: ['Admin', 'Manager'] },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="SyncPOS Logo" className="sidebar-logo" />
          <span className="sidebar-brand-name">SyncPOS</span>
        </div>

        <nav className="sidebar-nav">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <a
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-on-sidebar)' }}>{user?.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--teal-primary)' }}>{user?.role}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 className="page-title">
              {menuItems.find(item => item.id === currentView)?.name || 'SyncPOS'}
            </h2>
            {currentShift ? (
              <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                Shift Open (Float: LKR {currentShift.openingFloat.toLocaleString()})
              </span>
            ) : (
              <span className="badge badge-danger" style={{ padding: '6px 12px' }}>
                Shift Closed (Open shift in Shift Control)
              </span>
            )}
          </div>

          <div className="header-actions">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={styles.actionBtn}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#64748b" />}
            </button>

            {/* Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={styles.actionBtn}
                title="Notifications"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span style={styles.badgeCount}>{notifications.length}</span>
                )}
              </button>

              {showNotifications && (
                <div style={styles.notifDropdown}>
                  <div style={styles.notifHeader}>
                    <span style={{ fontWeight: '700' }}>Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} style={styles.clearBtn}>Clear</button>
                    )}
                  </div>
                  <div style={styles.notifList}>
                    {notifications.length === 0 ? (
                      <p style={styles.notifEmpty}>No new alerts</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} style={styles.notifItem}>
                          <span style={styles.notifType}>{notif.type || 'Alert'}</span>
                          <p style={styles.notifMsg}>{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              style={{ ...styles.actionBtn, color: '#ef4444' }}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-main)',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  badgeCount: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '0.65rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDropdown: {
    position: 'absolute',
    top: '45px',
    right: '0',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    width: '280px',
    maxHeight: '350px',
    overflowY: 'auto',
    boxShadow: 'var(--shadow-premium)',
    zIndex: 100,
  },
  notifHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--teal-primary)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
  notifList: {
    padding: '8px 0',
  },
  notifEmpty: {
    padding: '16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  notifItem: {
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
  },
  notifType: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--orange-primary)',
    textTransform: 'uppercase',
  },
  notifMsg: {
    fontSize: '0.85rem',
    marginTop: '2px',
    color: 'var(--text-main)',
  }
};
