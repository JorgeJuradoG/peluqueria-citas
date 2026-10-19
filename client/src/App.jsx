import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Services from "./pages/Services";
import Login from "./pages/Login";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl p-6">
        <Routes>
          <Route path="/" element={<Services />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </>
  );
}