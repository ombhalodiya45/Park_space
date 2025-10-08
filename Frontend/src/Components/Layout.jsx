import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Add top padding for fixed Navbar height, horizontal padding, and max width for desktop */}
      <main className="flex-1 pt-20 px-4 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
