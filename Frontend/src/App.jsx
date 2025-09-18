import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import './index.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import BookingPage from './pages/BookingPage';


function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/booking" element={<BookingPage />} />
                </Routes>
            </Layout>
        </Router>
    );
}


export default App
