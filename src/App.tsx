import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './pages/Menu';
import Admin from './pages/Admin';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Customer Menu */}
        <Route path="/" element={<Menu />} />
        <Route path="/order/:slug" element={<Menu />} />
        
        {/* Admin Panel */}
        <Route path="/admin" element={<Admin />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
