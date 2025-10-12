import React, { useEffect, useState } from 'react';
import { useAuth } from '../Components/AuthContext';

export default function ContactUs() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Autofill for logged-in users
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: user.fullName || f.fullName,
        email: user.email || f.email
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // Create a simple payload; extend as needed
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim()
      };

      // Basic client-side validation
      if (!payload.fullName || !payload.email || !payload.message) {
        setStatus({ type: 'error', message: 'Please fill name, email, and message.' });
        setSubmitting(false);
        return;
      }

      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // keep cookies/session consistent with your app
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: data.message || 'Message sent successfully.' });
        // Reset only subject and message to allow quick subsequent messages
        setForm((f) => ({ ...f, subject: '', message: '' }));
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to send message.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero/Heading */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Contact Us</h1>
          <p className="mt-3 text-gray-600 max-w-2xl">
            Questions about parking availability, bookings, or account issues? Send a message and the ParkSpace team will respond shortly.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Contact info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900">Get in touch</h2>
              <p className="mt-2 text-gray-600">
                Reach out for support, feedback, or partnership opportunities.
              </p>

              <div className="mt-6 space-y-5 text-gray-700">
                <div>
                  <p className="text-sm text-gray-500">Support Email</p>
                  <a href="mailto:support@parkspace.app" className="text-indigo-600 hover:underline">
                    support@parkspace.app
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href="tel:+11234567890" className="text-indigo-600 hover:underline">
                    +1 (123) 456-7890
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Office</p>
                  <p>ParkSpace HQ, 123 Downtown Ave, Suite 500</p>
                  <p>San Francisco, CA 94103</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900">Quick links</h3>
                <ul className="mt-3 space-y-2 text-indigo-600">
                  <li>
                    <a href="/booking" className="hover:underline">Book a Slot</a>
                  </li>
                  <li>
                    <a href="/about" className="hover:underline">About ParkSpace</a>
                  </li>
                  <li>
                    <a href="/contact" className="hover:underline">Customer Support</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Send a message</h2>

              {status.message && (
                <div
                  className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                    status.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {status.message}
                </div>
              )}

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={form.fullName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={form.subject}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Booking inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    value={form.message}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Write your message here..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    By submitting, consent is given to be contacted about this request.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`inline-flex items-center justify-center rounded-lg px-6 py-2 text-white font-semibold shadow
                      ${submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                    `}
                  >
                    {submitting ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </form>
            </div>

            {/* Optional: map or help card */}
            <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900">Need urgent help?</h3>
              <p className="mt-2 text-gray-600">
                For time-sensitive booking issues, call the support number above for immediate assistance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
