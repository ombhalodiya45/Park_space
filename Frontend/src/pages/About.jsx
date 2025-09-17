import React from 'react';

export default function About() {
    return (
        <div className="bg-gray-50">
            {/* Page Header */}
            <section className="py-14 text-center px-6">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                    About ParkSpace
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                    ParkSpace helps drivers find, reserve, and pay for nearby parking spots in real-time — saving time, fuel, and stress on every trip.
                </p>
            </section>

            {/* Main Card */}
            <section className="px-6 pb-12">
                <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl ring-1 ring-black/5">
                    <div className="p-8 md:p-12">
                        {/* Mission */}
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Mission</h2>
                            <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
                                Eliminate parking frustration by providing instant access to available, affordable, and safe parking spaces across the city.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <Stat num="500+" label="Active locations" color="blue" />
                            <Stat num="98%" label="Booking success" color="green" />
                            <Stat num="24/7" label="Customer support" color="purple" />
                        </div>

                        {/* Features */}
                        <div className="mt-12">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 text-center">What We Offer</h3>
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Feature
                                    icon="🕒"
                                    title="Real‑time availability"
                                    desc="Live updates ensure the spots you see are actually open."
                                />
                                <Feature
                                    icon="⚡"
                                    title="Instant booking"
                                    desc="Reserve in seconds with a simple, secure checkout."
                                />
                                <Feature
                                    icon="🔒"
                                    title="Secure payments"
                                    desc="All transactions are encrypted and PCI‑compliant."
                                />
                                <Feature
                                    icon="🧭"
                                    title="Smart navigation"
                                    desc="Turn‑by‑turn guidance to the exact entrance of your spot."
                                />
                            </div>
                        </div>

                        {/* How it works */}
                        <div className="mt-12">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 text-center">How It Works</h3>
                            <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Step number="1" title="Search" desc="Enter your destination and time to view nearby availability and prices." />
                                <Step number="2" title="Book" desc="Pick a spot that fits your needs and confirm your reservation." />
                                <Step number="3" title="Park" desc="Follow navigation, show your code or plate, and park with confidence." />
                            </ol>
                        </div>

                        {/* CTA */}
                        <div className="mt-12 text-center">
                            <a
                                href="/"
                                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors"
                            >
                                Get Started
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Stat({ num, label, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 text-blue-900/70',
        green: 'bg-green-50 text-green-700 text-green-900/70',
        purple: 'bg-purple-50 text-purple-700 text-purple-900/70',
    };
    const [bg, primary, subtle] = colors[color].split(' ');
    return (
        <div className={`rounded-xl ${bg} p-6 text-center`}>
            <p className={`text-3xl font-extrabold ${primary}`}>{num}</p>
            <p className={`mt-1 text-sm ${subtle}`}>{label}</p>
        </div>
    );
}

function Feature({ icon, title, desc }) {
    return (
        <div className="flex items-start gap-4 rounded-xl border p-5 bg-white">
            <div className="text-2xl">{icon}</div>
            <div>
                <h4 className="font-semibold text-gray-900">{title}</h4>
                <p className="mt-1 text-gray-600 text-sm">{desc}</p>
            </div>
        </div>
    );
}

function Step({ number, title, desc }) {
    return (
        <li className="relative rounded-xl border p-5 bg-white">
            <span className="absolute -top-3 -left-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                {number}
            </span>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="mt-1 text-gray-600 text-sm">{desc}</p>
        </li>
    );
}
