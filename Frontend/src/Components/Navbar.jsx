import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.fullName) {
      setDisplayName(user.fullName);
    } else {
      const saved = localStorage.getItem("username");
      setDisplayName(saved || '');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("username");
    setDisplayName('');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-extrabold text-indigo-600">
              ParkSpace
            </Link>
          </div>

          {/* Desktop Nav Links & Profile */}
          <div className="hidden md:flex md:items-center md:space-x-10">
            <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-indigo-600 font-medium">About</Link>
            <Link to="/booking" className="text-gray-700 hover:text-indigo-600 font-medium">Booking</Link>
            <Link to="/contact" className="text-gray-700 hover:text-indigo-600 font-medium">Contact Us</Link>
            <div className="relative flex items-center space-x-2">
              <FaUserCircle className="w-8 h-8 text-gray-400" />
              <span className="font-semibold text-gray-800">{displayName || 'Guest'}</span>
              {!displayName && (
                <Link to="/login" className="px-4 py-2 border rounded-full hover:bg-indigo-50">Login</Link>
              )}
              {displayName && (
                <>
                  <button onClick={() => setProfileOpen(!profileOpen)} aria-label="User menu" className="flex items-center focus:outline-none">
                    <svg className={`ml-2 transform transition-transform ${profileOpen ? 'rotate-180' : 'rotate-0'}`} width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-4 w-60 bg-white shadow-lg rounded-lg p-3">
                      <p className="block px-4 py-2 text-gray-700 font-semibold">{displayName}</p>
                      <p className="block px-4 py-1 text-gray-700 text-sm truncate">{user?.email}</p>
                      <button onClick={() => { setProfileOpen(false); handleLogout(); }} className="w-full bg-red-600 text-white py-2 rounded-lg">Logout</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Hamburger button for Mobile */}
          <div className="md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-800 focus:outline-none" aria-label="Open menu">
              <FaBars className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button onClick={() => setSidebarOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none" aria-label="Close menu">
                <FaTimes className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Link to="/" onClick={() => setSidebarOpen(false)} className="text-2xl font-extrabold text-indigo-600">
                  ParkSpace
                </Link>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                <Link to="/" onClick={() => setSidebarOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50">Home</Link>
                <Link to="/about" onClick={() => setSidebarOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50">About</Link>
                <Link to="/booking" onClick={() => setSidebarOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50">Booking</Link>
                <Link to="/contact" onClick={() => setSidebarOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50">Contact Us</Link>
              </nav>
            </div>
            {/* Profile/Guest login on mobile */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200">
              {displayName ? (
                <>
                  <div className="flex items-center">
                    <FaUserCircle className="w-10 h-10 text-gray-400" />
                    <div className="ml-3">
                      <p className="text-base font-medium text-gray-700">{displayName}</p>
                      <p className="text-sm font-medium text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                    onClick={() => { setSidebarOpen(false); handleLogout(); }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="w-full px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg shadow hover:from-indigo-600 hover:to-blue-700 transition text-center block"
                  onClick={() => setSidebarOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
            <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
          </div>
        </div>
      )}
    </nav>
  );
}
