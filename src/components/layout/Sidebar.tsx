import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Laptop,
  Image as ImageIcon,
  FolderHeart,
  Trash2,
  Info
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: <Laptop size={20} />, label: 'Studio', path: '/' },
    { icon: <FolderHeart size={20} />, label: 'My Gallery', path: '/gallery' },
    { icon: <Trash2 size={20} />, label: 'Deleted Items', path: '/deleted' },
    { icon: <Info size={20} />, label: 'About Us', path: '/about' },
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