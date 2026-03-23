import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Layout from "./Components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import BookingPage from "./pages/BookingPage";
import AdminPage from "./pages/AdminPage";
import SlotReservationPage from "./pages/SlotReservationPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import AddVehiclePage from "./pages/AddVehiclePage";
import { AuthProvider } from "./Components/AuthContext";
import ContactUs from "./pages/ContactUs";
import AdminRegister from "./pages/AdminRegister"; 
import AdminSignup from "./pages/AdminSignup";
import CheckoutPage from "./pages/CheckoutPage";
import TicketPage from "./pages/TicketPage";
import BookingTimePage from "./pages/BookingTimePage";

function PublicShell() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AdminShell() {
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/*Public routes WITH Layout */}
          <Route element={<PublicShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/booking-time/:id/:locationName" element={<BookingTimePage />} />
            <Route path="/slot-reservation/:id/:locationName" element={<SlotReservationPage />} />
            <Route path="/add-vehicle" element={<AddVehiclePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/ticket" element={<TicketPage />} />
            <Route path="/ticket/:id" element={<TicketPage />} />
          </Route>

          {/* Admin routes WITHOUT Layout */}
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
