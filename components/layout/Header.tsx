import React from 'react';
import { Menu, Bell, UserCircle } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, pageTitle }) => {
  const today = new Date();
  const dateString = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold ml-4 text-white">{pageTitle}</h1>
      </div>
      <div className="flex items-center space-x-4 md:space-x-6">
        <div className="hidden md:block text-sm text-gray-400">{dateString}</div>
        <button className="relative text-gray-400 hover:text-white">
          <Bell className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center space-x-2">
           <UserCircle className="h-8 w-8 text-teal-400" />
          <span className="hidden sm:block font-medium text-white">Juru Raksa</span>
        </div>
      </div>
    </header>
  );
};

export default Header;