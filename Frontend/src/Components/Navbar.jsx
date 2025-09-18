import React from 'react';

export default function Navbar() {
    return (
        <nav className="bg-blue-600 text-white py-4 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold">ParkSpace</h1>
                </div>
                
                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                    <a href="/" className="hover:text-blue-200 transition-colors">Home</a>
                    <a href="/About" className="hover:text-blue-200 transition-colors">About</a>
                    <a href="/Booking" className="hover:text-blue-200 transition-colors">Booking</a>
                    <a href="#" className="hover:text-blue-200 transition-colors">Login</a>
                </div>
                
                {/* Mobile Menu Button */}
                <button className="md:hidden text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </nav>
    );
}
