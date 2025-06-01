import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Laptop,
  Shirt,
  FolderHeart,
  Trash2,
  Info,
  User
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAppContext();
  
  const menuItems = [
    { icon: <Laptop size={20} />, label: 'Studio', path: '/' },
    { icon: <FolderHeart size={20} />, label: 'My Gallery', path: '/gallery' },
    { icon: <Trash2 size={20} />, label: 'Deleted Items', path: '/deleted' },
    { icon: <Info size={20} />, label: 'About Us', path: '/about' },
  ];

  return (
    <div className="w-72 h-full bg-[#171717] py-4 flex flex-col overflow-y-auto">
      <div className="px-4 mb-8">
        <div className="flex items-center">
          <div className="bg-white p-1 rounded">
            <Shirt size={18} className="text-black" />
          </div>
          <span className="ml-2 text-xl font-bold text-white">FASHNAI</span>
        </div>
      </div>

      {user && (
        <div className="px-4 mb-6">
          <div className="bg-[#222222] rounded-lg p-4 border border-[#333333]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#F8D74B] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-black">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 flex items-center justify-between border-t border-[#333333] pt-3">
              <span>Subscription</span>
              <span className="text-white capitalize">{user.subscription_tier}</span>
            </div>
          </div>
        </div>
      )}
      
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