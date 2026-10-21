import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import { ServiceCardSkeleton } from "../components/Skeleton";

export default function Services() {
  const { user } = useAuth();
  const salon = useSalon();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/services")
      .then((res) => setServices(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="rounded-2xl bg-ink px-6 py-14 text-center text-cream sm:py-20">
        <p className="text-sm uppercase tracking-[0.3em] text-gold">{salon.name}</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-bold sm:text-5xl">
          Reserva tu cita en menos de un minuto
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-cream/70">
          Elige servicio, profesional y hueco. Los horarios se actualizan en tiempo real.
        </p>
        <Link
          to={user ? "/reservar" : "/login"}
          className="mt-8 inline-flex rounded-lg bg-gold px-6 py-3 font-medium text-ink transition hover:bg-cream"
        >
          {user ? "Reservar ahora" : "Entrar para reservar"}
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-bold">Nuestros servicios</h2>

        {!loading && services.length === 0 && (
          <p className="mt-4 text-ink/50">Todavía no hay servicios disponibles.</p>
        )}

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            [1, 2, 3].map((n) => <ServiceCardSkeleton key={n} />)}
          {services.map((s) => (
            <li key={s._id} className="card transition hover:-translate-y-0.5 hover:shadow-md">
              <h3 className="text-xl font-semibold">{s.name}</h3>
              <p className="mt-1 text-sm text-ink/60">{s.durationMinutes} minutos</p>
              <p className="mt-4 font-display text-2xl text-gold-dark">{s.price} €</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}