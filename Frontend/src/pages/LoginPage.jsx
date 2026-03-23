import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Components/AuthContext';

// Custom Modal Component
function NotRegisteredModal({ onClose, onRegister }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-fadeIn">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-yellow-100 rounded-full p-3">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-gray-900">Oops! Not Registered Yet</h3>
          <p className="text-sm text-gray-500">
            It looks like you don't have an account with us. Please register first to continue.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onRegister}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
}

// Generic Error Modal (for other errors like wrong password)
function ErrorModal({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-center">
          <div className="bg-red-100 rounded-full p-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-gray-900">Login Failed</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showNotRegistered, setShowNotRegistered] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        login(data.user);
        navigate(from, { replace: true });
      } else {
        // Check if it's a "not registered / user not found" type error
        const msg = data.message?.toLowerCase() || '';
        if (
          msg.includes('not found') ||
          msg.includes('no user') ||
          msg.includes('does not exist') ||
          msg.includes('not registered') ||
          msg.includes('invalid email') // customize based on your backend message
        ) {
          setShowNotRegistered(true);
        } else {
          setErrorModal({ show: true, message: data.message || 'Something went wrong. Please try again.' });
        }
      }
    } catch (error) {
      setErrorModal({ show: true, message: 'Network error. Please check your connection.' });
    }
  };

  return (
    <>
      {/* Not Registered Modal */}
      {showNotRegistered && (
        <NotRegisteredModal
          onClose={() => setShowNotRegistered(false)}
          onRegister={() => {
            setShowNotRegistered(false);
            navigate('/signup');
          }}
        />
      )}

      {/* Generic Error Modal */}
      {errorModal.show && (
        <ErrorModal
          message={errorModal.message}
          onClose={() => setErrorModal({ show: false, message: '' })}
        />
      )}

      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
          <div>
            <h2 className="text-3xl font-extrabold text-center text-gray-900">
              Welcome Back!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Don't have an account yet?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="remember-me" className="ml-2 block text-gray-900">
                  Remember me
                </label>
              </div>
              <div>
                <a href="#" className="font-medium text-blue-600 hover:underline">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Log In
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}