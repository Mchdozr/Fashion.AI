import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import GalleryView from './components/gallery/GalleryView';
import StudioView from './components/studio/StudioView';
import HomeView from './components/home/HomeView';
import { AppProvider } from './contexts/AppContext';

function App() {
  return (
    <Router>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<StudioView />} />
            <Route path="/home" element={<HomeView />} />
            <Route path="/gallery" element={<GalleryView />} />
          </Routes>
        </Layout>
      </AppProvider>
    </Router>
  );
}

export default App;