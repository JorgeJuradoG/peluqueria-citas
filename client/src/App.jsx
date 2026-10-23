import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SALON_SLUG } from "./lib/salon";
import { SalonProvider } from "./context/SalonContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import CreateSalon from "./pages/CreateSalon";
import Services from "./pages/Services";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Book from "./pages/Book";
import Booked from "./pages/Booked";
import MyAppointments from "./pages/MyAppointments";
import Profile from "./pages/Profile";
import Agenda from "./pages/Agenda";
import AdminHome from "./pages/AdminHome";
import AdminServices from "./pages/AdminServices";
import AdminStylists from "./pages/AdminStylists";
import NotFound from "./pages/NotFound";
import Appearance from "./pages/Appearance";


function PlatformApp() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/crear-peluqueria" element={<CreateSalon />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function SalonApp() {
  const { pathname } = useLocation();

  return (
    <SalonProvider>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
        >
          Saltar al contenido
        </a>
        <Navbar />
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          <div key={pathname} className="animate-fade-in">
            <Routes>
              <Route path="/" element={<Services />} />
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar" element={<ForgotPassword />} />
              <Route path="/restablecer" element={<ResetPassword />} />
              <Route path="/reservar" element={<ProtectedRoute><Book /></ProtectedRoute>} />
              <Route path="/reservada" element={<ProtectedRoute><Booked /></ProtectedRoute>} />
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
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminHome />
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
                path="/admin/apariencia"
                 element={
             <ProtectedRoute roles={["admin"]}>
             <Appearance />
             </ProtectedRoute>
               }
/>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </SalonProvider>
  );
}

export default function App() {
  return SALON_SLUG ? <SalonApp /> : <PlatformApp />;
}