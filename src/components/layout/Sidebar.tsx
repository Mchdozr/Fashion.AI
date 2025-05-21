import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Laptop,
  Users,
  Image as ImageIcon,
  FolderHeart,
  LayoutTemplate,
  Code,
  History,
  Home
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', path: '/home' },
    { icon: <Laptop size={20} />, label: 'Studio', path: '/' },
    { icon: <Users size={20} />, label: 'Models', path: '/models' },
    { icon: <ImageIcon size={20} />, label: 'Background', path: '/background' },
    { icon: <FolderHeart size={20} />, label: 'My Gallery', path: '/gallery' },
    { icon: <LayoutTemplate size={20} />, label: 'Mockups', path: '/mockups', beta: true },
    { icon: <Code size={20} />, label: 'Developer API', path: '/api' },
    { icon: <History size={20} />, label: 'Changelog', path: '/changelog' },
  ];

  return (
    <div className="w-60 h-full bg-[#171717] py-4 flex flex-col overflow-y-auto">
      <div className="px-4 mb-8">
        <div className="flex items-center">
          <div className="bg-white p-1 rounded">
            <ImageIcon size={18} className="text-black" />
          </div>
          <span className="ml-2 text-xl font-bold text-white">FASHNAI</span>
        </div>
      </div>
      <nav className="flex-1">
        <ul>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm ${
                    isActive
                      ? 'bg-[#2A2A2A] text-white border-l-2 border-[#F8D74B]'
                      : 'text-gray-300 hover:bg-[#2A2A2A] transition-colors duration-150'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                  {item.beta && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">
                      BETA
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;