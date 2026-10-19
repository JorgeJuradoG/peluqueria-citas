import { useEffect, useState } from "react";
import api from "./services/api";

export default function App() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get("/services").then((res) => setServices(res.data));
  }, []);

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold">Servicios</h1>
      <ul className="mt-4 space-y-2">
        {services.map((s) => (
          <li key={s._id} className="rounded border p-3">
            {s.name} · {s.durationMinutes} min · {s.price} €
          </li>
        ))}
      </ul>
    </div>
  );
}