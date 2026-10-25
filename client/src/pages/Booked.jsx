import { Link, Navigate, useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import Confetti from "../components/Confetti";
import { useSalon } from "../context/SalonContext";
import { formatDateTime } from "../lib/dates";
import {
  buildICS,
  downloadICS,
  googleCalendarUrl,
  eventFromAppointment,
} from "../lib/calendar";

export default function Booked() {
  const { state } = useLocation();
  const salon = useSalon();
  const appointment = state?.appointment;

  // Si se recarga la página, el estado se pierde: mandamos a Mis citas
  if (!appointment) return <Navigate to="/mis-citas" replace />;

  const event = eventFromAppointment({
    ...appointment,
    salonName: salon.name,
    location: salon.address,
    phone: salon.phone,
  });

  const mapUrl = salon.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`
    : "";

  return (
    <div className="mx-auto max-w-md">
      <Confetti />
      <div className="card text-center">
        <span className="mx-auto flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-bold">¡Cita reservada!</h1>
        <p className="mt-1 text-sm text-ink/70">Te hemos enviado la confirmación por correo.</p>

        <dl className="mt-6 space-y-2 rounded-lg bg-sand/50 p-4 text-left text-sm">
          <p>
            <dt className="inline text-ink/70">Cuándo: </dt>
            <dd className="inline font-medium capitalize">
              {formatDateTime(appointment.start, salon.timezone)}
            </dd>
          </p>
          <p>
            <dt className="inline text-ink/70">Servicio: </dt>
            <dd className="inline font-medium">
              {appointment.serviceName} ({appointment.price} €)
            </dd>
          </p>
          <p>
            <dt className="inline text-ink/70">Con: </dt>
            <dd className="inline font-medium">{appointment.stylistName}</dd>
          </p>
          {salon.address && (
            <p>
              <dt className="inline text-ink/70">Dónde: </dt>
              <dd className="inline font-medium">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  {salon.address}
                </a>
              </dd>
            </p>
          )}
        </dl>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => downloadICS("cita.ics", buildICS(event))}
            className="btn-primary w-full"
          >
            Añadir al calendario (.ics)
          </button>
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline w-full"
          >
            Abrir en Google Calendar
          </a>
          <div className="flex gap-3 pt-2">
            <Link to="/inicio" className="btn-outline flex-1">Inicio</Link>
            <Link to="/reservar" className="btn-outline flex-1">Reservar otra</Link>
          </div>
        </div>
      </div>
    </div>
  );
}