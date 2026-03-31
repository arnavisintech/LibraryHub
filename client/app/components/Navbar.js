'use client';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar({ title, onMenuClick }) {
  const { user } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.hamburger} onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.right}>
        <div className={styles.profile}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.info}>
            <div className={styles.name}>{user?.username}</div>
            <div className={styles.role}>{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
