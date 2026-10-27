import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SALON_SLUG } from "./lib/salon";
import { SalonProvider, useSalon } from "./context/SalonContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import DemoBanner from "./components/DemoBanner";
import VerifyEmailBanner from "./components/VerifyEmailBanner";
import { Skeleton } from "./components/Skeleton";

// Cada página se descarga solo cuando se visita
const Landing = lazy(() => import("./pages/Landing"));
const CreateSalon = lazy(() => import("./pages/CreateSalon"));
const Access = lazy(() => import("./pages/Access"));
const Services = lazy(() => import("./pages/Services"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ConfirmEmail = lazy(() => import("./pages/ConfirmEmail"));
const Book = lazy(() => import("./pages/Book"));
const Booked = lazy(() => import("./pages/Booked"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const Profile = lazy(() => import("./pages/Profile"));
const Agenda = lazy(() => import("./pages/Agenda"));
const AdminHome = lazy(() => import("./pages/AdminHome"));
const AdminServices = lazy(() => import("./pages/AdminServices"));
const AdminStylists = lazy(() => import("./pages/AdminStylists"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Appearance = lazy(() => import("./pages/Appearance"));
const Legal = lazy(() => import("./pages/Legal"));
const Stats = lazy(() => import("./pages/Stats"));
const Home = lazy(() => import("./pages/Home"));
const AdminAccount = lazy(() => import("./pages/AdminAccount"));

// Título de la pestaña: «Agenda · Peluquería Lola»
const PAGE_TITLES = {
  "/login": "Entrar",
  "/recuperar": "Recuperar contraseña",
  "/restablecer": "Nueva contraseña",
  "/confirmar-correo": "Confirmar correo",
  "/reservar": "Reservar cita",
  "/reservada": "Cita reservada",
  "/mis-citas": "Mis citas",
  "/perfil": "Mi perfil",
  "/agenda": "Agenda",
  "/inicio": "Inicio",
  "/admin": "Administración",
  "/admin/servicios": "Servicios",
  "/admin/estilistas": "Equipo",
  "/admin/apariencia": "Apariencia",
  "/admin/estadisticas": "Estadísticas",
  "/admin/negocio": "Mi negocio",
};

function RouteTitle({ pathname }) {
  const { name } = useSalon();
  useEffect(() => {
    const page = PAGE_TITLES[pathname.replace(/\/$/, "") || "/"];
    document.title = page ? `${page} · ${name}` : name;
  }, [pathname, name]);
  return null;
}

// Mientras llega el código de la página
function PageFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-10" role="status" aria-label="Cargando">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-8 h-48 w-full rounded-3xl" />
    </div>
  );
}

function PlatformApp() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/crear-peluqueria" element={<CreateSalon />} />
          <Route path="/entrar" element={<Access />} />
          <Route path="/privacidad" element={<Legal kind="privacidad" />} />
          <Route path="/terminos" element={<Legal kind="terminos" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

function SalonApp() {
  const { pathname } = useLocation();

  return (
    <SalonProvider>
      <ScrollToTop />
      <RouteTitle pathname={pathname} />
      <div className="flex min-h-screen flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
        >
          Saltar al contenido
        </a>
        <DemoBanner />
        <Navbar />
        <VerifyEmailBanner />
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          <div key={pathname} className="animate-fade-in">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Services />} />
                <Route path="/login" element={<Login />} />
                <Route path="/recuperar" element={<ForgotPassword />} />
                <Route path="/restablecer" element={<ResetPassword />} />
                <Route path="/confirmar-correo" element={<ConfirmEmail />} />
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
                <Route
                  path="/admin/estadisticas"
                  element={
                    <ProtectedRoute roles={["admin"]}>
                      <Stats />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/negocio"
                  element={
                    <ProtectedRoute roles={["admin"]}>
                      <AdminAccount />
                    </ProtectedRoute>
                  }
                />
                <Route path="/inicio" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
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