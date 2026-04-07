import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage        from './pages/auth/LoginPage';
import DashboardPage    from './pages/dashboard/DashboardPage';
import BooksPage        from './pages/books/BooksPage';
import MembersPage      from './pages/members/MembersPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import IssuesPage       from './pages/issues/IssuesPage';
import FinesPage        from './pages/fines/FinesPage';
import SettingsPage     from './pages/settings/SettingsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import UsersPage         from './pages/users/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login"              element={<LoginPage />} />
      <Route path="/dashboard"          element={<DashboardPage />} />
      <Route path="/books"              element={<BooksPage />} />
      <Route path="/members"            element={<MembersPage />} />
      <Route path="/members/:id"        element={<MemberDetailPage />} />
      <Route path="/issues"             element={<IssuesPage />} />
      <Route path="/fines"              element={<FinesPage />} />
      <Route path="/settings"           element={<SettingsPage />} />
      <Route path="/notifications"      element={<NotificationsPage />} />
      <Route path="/users"              element={<UsersPage />} />
      <Route path="*"                   element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
