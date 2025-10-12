import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import SlotReservationPage from './pages/SlotReservationPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import AddVehiclePage from './pages/AddVehiclePage';
import { AuthProvider } from "./Components/AuthContext";
import ContactUs from './pages/ContactUs';
 // Ensure correct path

function App() {
    return (
        <AuthProvider>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/contact" element={<ContactUs />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/slot-reservation/:customCode" element={<SlotReservationPage />} />
                        <Route path="/add-vehicle" element={<AddVehiclePage />} />
                    </Routes>
                </Layout>
            </Router>
        </AuthProvider>
    );
}

export default App;
