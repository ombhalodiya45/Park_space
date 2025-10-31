import React from 'react';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            
            {/* Hero Section */}
            <section className="flex-1 bg-gray-50 text-center py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4 leading-tight">
                        Find & Book
                        <br />
                        Parking Easily <span className="text-blue-600"></span>
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Search for available parking slots in real-time 
                        and book instantly.
                    </p>
                    
                    {/* CTA Button */}
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg" >
                        Get Started
                    </button>
                </div>
            </section>
        </div>
    );
}
