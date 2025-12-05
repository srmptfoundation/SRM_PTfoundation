import React from 'react';
import { useAuth } from '../App';
import { Role } from '../types';

export const Navbar: React.FC<{ title: string }> = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-ptf-red text-white shadow-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {/* Full Logo */}
              <img
                src="/logo/logo2.1.png"
                alt="PTF Vizhuthugal Logo"
                className="h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden">
                <div className="font-bold text-lg">PTF Vizhuthugal</div>
                <div className="text-xs text-red-100">Student Leave Portal</div>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <span className="text-sm font-medium">{title}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-xs text-red-200 uppercase">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded text-sm transition-colors border border-gray-900 shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};