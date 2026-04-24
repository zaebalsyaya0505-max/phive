import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AdvertisePage from './pages/AdvertisePage';
import PartnersPage from './pages/PartnersPage';
import AboutPage from './pages/AboutPage';
import DocsPage from './pages/DocsPage';
import DownloadPage from './pages/DownloadPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import TonLoginPage from './pages/TonLoginPage';

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
      </Route>
      <Route path="/auth/ton" element={<TonLoginPage />} />
    </Routes>
  );
}

export default App;
