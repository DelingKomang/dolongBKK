import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setIsDesktopOpen(!isDesktopOpen);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
        isDesktopOpen={isDesktopOpen}
        activePage={activePage} 
        setActivePage={setActivePage} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} pageTitle={activePage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;