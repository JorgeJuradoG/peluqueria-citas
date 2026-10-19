import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Services from "./pages/Services";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import MyAppointments from "./pages/MyAppointments";
import Book from "./pages/Book";
import Agenda from "./pages/Agenda";
import AdminServices from "./pages/AdminServices";
export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl p-6">
        <Routes>
          <Route path="/" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reservar" element={<ProtectedRoute><Book /></ProtectedRoute>} />
          <Route path="/mis-citas" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute roles={["admin", "stylist"]}><Agenda /></ProtectedRoute>} />
          <Route path="/admin/servicios" element={<ProtectedRoute roles={["admin"]}><AdminServices /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}