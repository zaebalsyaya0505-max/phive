import { Routes, Route } from 'react-router';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ui/ProtectedRoute';
import HomePage from '@/features/pages/public/HomePage';
import AdvertisePage from '@/features/pages/public/AdvertisePage';
import PartnersPage from '@/features/pages/public/PartnersPage';
import AboutPage from '@/features/pages/public/AboutPage';
import DocsPage from '@/features/pages/public/DocsPage';
import DownloadPage from '@/features/pages/public/DownloadPage';
import ContactPage from '@/features/pages/public/ContactPage';
import BlogPage from '@/features/pages/public/BlogPage';
import PrivacyPage from '@/features/pages/public/PrivacyPage';
import TermsPage from '@/features/pages/public/TermsPage';
import NotesPage from '@/features/pages/notes/NotesPage';
import TonLoginPage from '@/features/pages/auth/TonLoginPage';
import LoginPage from '@/features/pages/auth/LoginPage';
import SignUpPage from '@/features/pages/auth/SignUpPage';
import ProfilePage from '@/features/pages/auth/ProfilePage';
import AdminDashboard from '@/features/pages/admin/AdminDashboard';
import AdminLoginPage from '@/features/pages/admin/AdminLoginPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/advertise" element={<AdvertisePage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      </Route>
      <Route path="/auth/ton" element={<TonLoginPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignUpPage />} />
    </Routes>
  );
}

export default App;
