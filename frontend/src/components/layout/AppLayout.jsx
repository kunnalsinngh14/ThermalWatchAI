import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
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
