import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import './index.css';
import Layout from './Components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import SlotReservationPage from './pages/SlotReservationPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/slot-reservation/:customCode" element={<SlotReservationPage />} />
                </Routes>
            </Layout>
        </Router>
    );
}


export default App
