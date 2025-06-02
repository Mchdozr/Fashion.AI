import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Laptop,
  Shirt,
  FolderHeart,
  Trash2,
  Info,
  X
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { user } = useAppContext();
  
  const menuItems = [
    { icon: <Laptop size={24} />, label: 'Studio', path: '/' },
    { icon: <FolderHeart size={24} />, label: 'Gallery', path: '/gallery' },
    { icon: <Trash2 size={24} />, label: 'Trash', path: '/deleted' },
    { icon: <Info size={24} />, label: 'About', path: '/about' },
  ];

  const getInitials = (user: any) => {
    if (!user) return '';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <div className="h-full bg-[#171717] py-4 flex flex-col w-72">
      <div className="flex items-center justify-between px-4 mb-8">
        <div className="flex items-center">
          <div className="bg-white p-2 rounded">
            <Shirt size={20} className="text-black" />
          </div>
          <span className="ml-2 text-xl font-bold text-white">FASHNAI</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#333333] rounded-lg lg:hidden"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {user && (
        <div className="px-4 mb-6">
          <div className="bg-[#222222] rounded-lg p-4 border border-[#333333]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#F8D74B] flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-black">
                  {getInitials(user)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-base font-medium text-white truncate">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-sm text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 flex items-center justify-between border-t border-[#333333] pt-3">
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
                  onClick={onClose}
                  className={`flex items-center px-4 py-4 text-base ${
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