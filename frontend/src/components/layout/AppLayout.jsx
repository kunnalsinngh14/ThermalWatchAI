import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={`app-layout ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
      <Sidebar isOpen={isSidebarOpen} />
      <div className="main-content">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="canvas-area">
          <Outlet />
        </div>
      </div>
      {/* Right margin reserved for future chatbot per PRD 5.2 */}
      <div className="chatbot-reserved-margin"></div>
    </div>
  );
};

export default AppLayout;
