import { Routes, Route, Navigate } from "react-router-dom";
import { SALON_SLUG } from "./lib/salon";
import { SalonProvider } from "./context/SalonContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import CreateSalon from "./pages/CreateSalon";
import Services from "./pages/Services";
import Login from "./pages/Login";
import Book from "./pages/Book";
import MyAppointments from "./pages/MyAppointments";
import Profile from "./pages/Profile";
import Agenda from "./pages/Agenda";
import AdminServices from "./pages/AdminServices";
import AdminStylists from "./pages/AdminStylists";
import AdminHome from "./pages/AdminHome";
import NotFound from "./pages/NotFound";





function PlatformApp() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/crear-peluqueria" element={<CreateSalon />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SalonApp() {
  return (
    <SalonProvider>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Routes>
          <Route path="/" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reservar" element={<ProtectedRoute><Book /></ProtectedRoute>} />
          <Route path="/mis-citas" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute roles={["admin", "stylist"]}>
                <Agenda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/servicios"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/estilistas"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminStylists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
             <ProtectedRoute roles={["admin"]}>
             <AdminHome />
            </ProtectedRoute>
              }
            />
            
          <Route path="*" element={<NotFound />} />

        </Routes>
      </main>
    </SalonProvider>
  );
}

export default function App() {
  return SALON_SLUG ? <SalonApp /> : <PlatformApp />;
}