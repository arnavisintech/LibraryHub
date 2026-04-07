import { useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, BookOpen, Users, RefreshCw, LogOut, Library,
  DollarSign, Settings, Bell, Sun, Moon, UserCog,
} from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import './Sidebar.css';

const mainNavItems = [
  { href: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/books',         label: 'Books',           icon: BookOpen },
  { href: '/members',       label: 'Members',         icon: Users },
  { href: '/issues',        label: 'Issue / Return',  icon: RefreshCw },
  { href: '/fines',         label: 'Fines',           icon: DollarSign },
];

const adminNavItems = [
  { href: '/notifications', label: 'Announcements',   icon: Bell },
  { href: '/users',         label: 'Users',           icon: UserCog },
  { href: '/settings',      label: 'Settings',        icon: Settings },
];

const navItemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
      delay: i * 0.05 + 0.1,
    },
  }),
};

function NavLink({ href, label, icon: Icon, isActive, onClick, index, shouldAnimate }) {
  return (
    <motion.div
      custom={index}
      variants={navItemVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate="visible"
      style={{ position: 'relative' }}
    >
      <Link
        to={href}
        className={`sidebar-nav-item ${isActive ? 'sidebar-active' : ''}`}
        onClick={onClick}
      >
        {isActive && (
          <motion.span
            className="sidebar-pill"
            layoutId="activePill"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="sidebar-nav-icon-wrap">
          <Icon size={18} />
        </span>
        <span className="sidebar-nav-label">{label}</span>
      </Link>
    </motion.div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const hasAnimated = useRef(false);
  const shouldAnimate = !hasAnimated.current;
  if (!hasAnimated.current) hasAnimated.current = true;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Logo */}
      <motion.div
        className="sidebar-header"
        initial={shouldAnimate ? { opacity: 0, y: -8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="sidebar-logo">
          <Library size={20} color="#fff" />
        </div>
        <div>
          <h2 className="sidebar-title">LibraryHub</h2>
          <span className="sidebar-subtitle">Management System</span>
        </div>
      </motion.div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <LayoutGroup>
          <span className="sidebar-section-title">Main Menu</span>
          {mainNavItems.map((item, i) => (
            <NavLink
              key={item.href}
              {...item}
              isActive={pathname === item.href}
              onClick={onClose}
              index={i}
              shouldAnimate={shouldAnimate}
            />
          ))}

          {user?.role === 'admin' && (
            <>
              <span className="sidebar-section-title" style={{ marginTop: 12 }}>Admin</span>
              {adminNavItems.map((item, i) => (
                <NavLink
                  key={item.href}
                  {...item}
                  isActive={pathname === item.href}
                  onClick={onClose}
                  index={mainNavItems.length + i}
                  shouldAnimate={shouldAnimate}
                />
              ))}
            </>
          )}
        </LayoutGroup>
      </nav>

      {/* Light / Dark toggle */}


      {/* Footer */}
      <div className="sidebar-footer">
        <motion.button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <LogOut size={18} />
          Logout
        </motion.button>
      </div>
    </aside>
  );
}
