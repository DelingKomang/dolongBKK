import React from 'react';
import { X, Feather } from 'lucide-react';
import { SIDEBAR_MENU } from '../../constants';
import type { SidebarMenuItem } from '../../types';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopOpen: boolean;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen, isDesktopOpen, activePage, setActivePage }) => {
  const handleItemClick = (name: string) => {
    setActivePage(name);
    if(window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };
  
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity lg:hidden ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      ></div>
      
      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 bg-gray-900 border-r border-gray-800 
          transform transition-all duration-300 ease-in-out z-30 overflow-hidden
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 
          ${isDesktopOpen ? 'lg:w-64' : 'lg:w-0 lg:border-r-0'}
          w-64
        `}
      >
        {/* Inner Container to maintain width during collapse animation */}
        <div className="w-64 h-full flex flex-col">
          <div className="flex items-center justify-between p-4 h-16 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Feather className="h-8 w-8 text-teal-400" />
              <span className="text-xl font-bold text-white">Bacol Bigalow</span>
            </div>
            <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <ul>
              {SIDEBAR_MENU.map((item: SidebarMenuItem) => (
                <li key={item.name}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleItemClick(item.name);
                    }}
                    className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 whitespace-nowrap ${
                      activePage === item.name
                        ? 'bg-teal-500 bg-opacity-20 text-teal-300 font-semibold'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3 shrink-0" />
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;