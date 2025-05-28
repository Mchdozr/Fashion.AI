import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import GalleryView from './components/gallery/GalleryView';
import StudioView from './components/studio/StudioView';
import LoginPage from './components/auth/LoginPage';
import VerifyEmail from './components/auth/VerifyEmail';
import { AppProvider } from './contexts/AppContext';
import { useAppContext } from './contexts/AppContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <StudioView />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/gallery" element={
            <ProtectedRoute>
              <Layout>
                <GalleryView />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AppProvider>
    </Router>
  );
}

export default App;