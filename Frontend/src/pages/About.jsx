import React from 'react';

export default function About() {
    return (
        <div className="min-h-screen flex flex-col">
            
            {/* About Section */}
            <section className="flex-1 bg-gray-50 py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                        About ParkSpace
                    </h1>
                    
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <p className="text-lg text-gray-600 mb-6">
                            ParkSpace is a revolutionary parking management system that helps you find and book parking slots in real-time.
                        </p>
                        
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
                        <p className="text-gray-600 mb-6">
                            To eliminate the stress of finding parking by providing instant access to available parking spaces across the city.
                        </p>
                        
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Features</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>Real-time parking availability</li>
                            <li>Instant booking and payment</li>
                            <li>GPS navigation to your spot</li>
                            <li>24/7 customer support</li>
                        </ul>
                    </div>
                </div>
            </section>
            
        </div>
    );
}
