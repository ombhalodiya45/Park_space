import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import { useAuth } from './AuthContext';

/* Page-level profile drawer for desktop (md+) */
function PageLevelProfileDrawer({ open, onClose, onLogout, user, displayName }) {
  if (!open) return null;

  return (
    <div
      className="fixed left-0 right-0 z-40 top-16 px-4 sm:px-6 hidden md:block"
      aria-modal="true"
      role="dialog"
    >
      {/* click-away */}
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-[0_12px_40px_-8px_rgba(16,24,40,0.2)]">
        <div className="absolute -top-2 right-8 h-4 w-4 rotate-45 bg-white border-t border-l border-gray-200"></div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
              {displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="py-1">
          <button
            className="w-full flex items-center gap-3 px-5 py-2 hover:bg-gray-50 text-sm text-gray-700"
            onClick={onClose}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">👤</span>
            <span>Edit profile</span>
          </button>

          <button
            className="w-full flex items-center gap-3 px-5 py-2 hover:bg-gray-50 text-sm text-gray-700"
            onClick={onClose}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">⚙️</span>
            <span>Account settings</span>
          </button>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="px-5 py-4">
          <button
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2 font-semibold hover:bg-red-700"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

  /* Mobile sheet (smaller than md) */
  function MobileProfileSheet({ open, onClose, onLogout, user, displayName }) {
    if (!open) return null;

    return (
      <div className="md:hidden fixed inset-0 z-40">
        {/* translucent backdrop */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
          aria-hidden="true"
        />
        {/* sheet wrapper anchored under navbar */}
        <div
          className={`
            absolute left-0 right-0 top-16
            transition-transform duration-200
            ${open ? 'translate-y-0' : '-translate-y-3'}
          `}
        >
          <div className="px-4">
            <div className="mx-auto w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl mt-3">
              {/* content is auto height; outer container scrolls if needed */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                    {displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="py-1">
                <button
                  className="w-full flex items-center gap-3 px-5 py-2 hover:bg-gray-50 text-sm text-gray-700"
                  onClick={onClose}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">👤</span>
                  <span>Edit profile</span>
                </button>

                <button
                  className="w-full flex items-center gap-3 px-5 py-2 hover:bg-gray-50 text-sm text-gray-700"
                  onClick={onClose}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">⚙️</span>
                  <span>Account settings</span>
                </button>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="px-5 py-4">
                <button
                  onClick={onLogout}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2 font-semibold hover:bg-red-700"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      const saved = localStorage.getItem('username');
      setDisplayName(saved || '');
    }
  }, [user]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setProfileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (_) {}
    logout();
    localStorage.removeItem('username');
    setProfileOpen(false);
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-white/90 border-b border-gray-100 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-extrabold text-indigo-600">
                ParkSpace
              </Link>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex md:items-center md:space-x-10">
              <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">Home</Link>
              <Link to="/about" className="text-gray-700 hover:text-indigo-600 font-medium">About</Link>
              <Link to="/booking" className="text-gray-700 hover:text-indigo-600 font-medium">Booking</Link>
              <Link to="/contact" className="text-gray-700 hover:text-indigo-600 font-medium">Contact Us</Link>

              <div className="relative flex items-center space-x-2">
                <FaUserCircle className="w-8 h-8 text-gray-400" />
                <span className="font-semibold text-gray-800">{displayName || 'Guest'}</span>

                {!displayName ? (
                  <Link
                    to="/login"
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:opacity-95 shadow"
                  >
                    Login
                  </Link>
                ) : (
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    aria-label="User menu"
                    className="flex items-center focus:outline-none"
                  >
                    <svg
                      className={`ml-2 transform transition-transform ${profileOpen ? 'rotate-180' : 'rotate-0'}`}
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                aria-label="Open menu"
              >
                <FaBars className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 flex z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
                  aria-label="Close menu"
                >
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
                      onClick={() => {
                        setSidebarOpen(false);
                        handleLogout();
                      }}
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

              <div className="flex-shrink-0 w-14" aria-hidden="true" />
            </div>
          </div>
        )}
      </nav>

      {/* Page-level drawers */}
      <PageLevelProfileDrawer
        open={!!displayName && profileOpen}
        onClose={() => setProfileOpen(false)}
        onLogout={handleLogout}
        user={user}
        displayName={displayName}
      />
      <MobileProfileSheet
        open={!!displayName && profileOpen}
        onClose={() => setProfileOpen(false)}
        onLogout={handleLogout}
        user={user}
        displayName={displayName}
      />
    </>
  );
}
