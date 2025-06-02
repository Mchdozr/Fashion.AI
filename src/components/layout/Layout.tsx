import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#1F1F1F] text-white">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Layout;