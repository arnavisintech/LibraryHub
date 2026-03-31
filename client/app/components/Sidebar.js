'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, RefreshCw, LogOut, Library } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/books',     label: 'Books',     icon: BookOpen },
  { href: '/members',   label: 'Members',   icon: Users },
  { href: '/issues',    label: 'Issue / Return', icon: RefreshCw },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Library size={22} color="#fff" />
          </div>
          <div>
            <h2 className={styles.title}>LibraryHub</h2>
            <span className={styles.subtitle}>Management System</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <span className={styles.sectionTitle}>Main Menu</span>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
              onClick={onClose}
            >
              <Icon size={18} className={styles.navIcon} />
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
