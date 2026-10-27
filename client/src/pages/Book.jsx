import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  CalendarX,
  Clock,
  Loader2,
  Moon,
  Scissors,
  Sun,
  UserRound,
} from "lucide-react";
import api from "../services/api";
import useStylistSocket from "../hooks/useStylistSocket";
import useTerms from "../hooks/useTerms";
import Avatar from "../components/Avatar";
import { useConfirm, useToast } from "../context/UIContext";
import { useSalon } from "../context/SalonContext";
import { todayISO } from "../lib/dates";
import PolicyNotice from "../components/PolicyNotice";


// El segundo paso lleva el término que use la peluquería (estilista, barbero...)
const stepNames = (t) => ["Servicio", t.One, "Día y hora"];

// Suma días a una fecha AAAA-MM-DD sin depender de la zona horaria del navegador
function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayParts(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    weekday: d.toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" }),
    day: d.getUTCDate(),
    month: d.toLocaleDateString("es-ES", { month: "short", timeZone: "UTC" }),
  };
}

function Progress({ current, names }) {
  return (
    <ol className="flex items-center" aria-label="Progreso de la reserva">
      {names.map((name, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={name} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                    ? "bg-ink text-cream"
                    : "bg-sand text-ink/60"
                }`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={`hidden text-sm sm:inline ${
                  active ? "font-medium" : "text-ink/60"
                }`}
              >
                {name}
              </span>
            </div>
            {i < names.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-3 h-0.5 flex-1 rounded transition ${
                  done ? "bg-emerald-600" : "bg-sand"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Step({ icon: Icon, title, children }) {
  return (
    <section className="card animate-fade-up">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const choiceClass = (selected) =>
  `relative rounded-xl border p-4 text-left transition ${
    selected
      ? "border-gold bg-gold/10 ring-2 ring-gold/30"
      : "border-sand hover:-translate-y-0.5 hover:border-gold hover:shadow-sm"
  }`;

function SlotGroup({ title, icon: Icon, slots, onPick }) {
  if (slots.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-ink/70">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {title}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {slots.map((slot) => (
          <button
            key={slot.start}
            onClick={() => onPick(slot)}
            className="rounded-full border border-ink/15 py-2 text-sm font-medium transition hover:border-ink hover:bg-ink hover:text-cream active:scale-95"
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Book() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const terms = useTerms();
  const { timezone } = useSalon();
  const today = todayISO(timezone);

  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    api.get("/services").then((res) => setServices(res.data));
    api.get("/stylists").then((res) => setStylists(res.data));
  }, []);

  const availableStylists = stylists.filter((s) =>
    s.services.some((sv) => sv._id === serviceId)
  );

  async function loadSlots() {
    if (!serviceId || !stylistId || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const { data } = await api.get(`/stylists/${stylistId}/availability`, {
        params: { date, serviceId },
      });
      setSlots(data.slots);
    } catch (err) {
      setSlots([]);
      toast.error(err.response?.data?.message || "Error al cargar huecos");
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, [serviceId, stylistId, date]);

  useStylistSocket(stylistId, loadSlots);

  async function reserve(slot) {
    const service = services.find((s) => s._id === serviceId);
    const stylist = stylists.find((s) => s._id === stylistId);

    const ok = await confirm({
      title: "Confirmar reserva",
      message: `${service.name} con ${stylist.user.name} a las ${slot.label} (${service.price} €).`,
      confirmText: "Reservar",
    });
    if (!ok) return;

    try {
      const { data } = await api.post("/appointments", {
        stylistId,
        serviceId,
        start: slot.start,
      });
      navigate("/reservada", {
        state: {
          appointment: {
            id: data._id,
            start: data.start,
            end: data.end,
            serviceName: service.name,
            price: service.price,
            stylistName: stylist.user.name,
          },
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo reservar");
      loadSlots();
    }
  }

  const current = !serviceId ? 0 : !stylistId ? 1 : 2;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const morning = slots.filter((s) => parseInt(s.label, 10) < 14);
  const afternoon = slots.filter((s) => parseInt(s.label, 10) >= 14);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-bold">Reservar cita</h1>
      <p className="mt-1 text-ink/70">Tres pasos y listo.</p>
      <PolicyNotice className="mt-4" />
      <div className="mt-6">
        <Progress current={current} names={stepNames(terms)} />
      </div>

      <div className="mt-8 space-y-5">
        <Step icon={Scissors} title="Elige un servicio">
          {services.length === 0 && (
            <p className="text-ink/60">Esta peluquería todavía no tiene servicios.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s._id}
                onClick={() => {
                  setServiceId(s._id);
                  setStylistId("");
                }}
                aria-pressed={serviceId === s._id}
                className={choiceClass(serviceId === s._id)}
              >
                {serviceId === s._id && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[#17191c]">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                )}
                <p className="pr-6 font-medium">{s.name}</p>
                <p className="mt-1 flex items-center gap-3 text-sm text-ink/70">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {s.durationMinutes} min
                  </span>
                  <span className="font-medium text-gold-dark">{s.price} €</span>
                </p>
              </button>
            ))}
          </div>
        </Step>

        {serviceId && (
          <Step icon={UserRound} title={`Elige ${terms.one}`}>
            {availableStylists.length === 0 ? (
              <p className="text-ink/60">Nadie ofrece este servicio por ahora.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {availableStylists.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => setStylistId(s._id)}
                    aria-pressed={stylistId === s._id}
                    className={`${choiceClass(stylistId === s._id)} flex items-center gap-3`}
                  >
                    <Avatar name={s.user.name} size="lg" />
                    <span className="min-w-0">
                      <span className="block font-medium">{s.user.name}</span>
                      {s.bio && (
                        <span className="block truncate text-xs text-ink/70">{s.bio}</span>
                      )}
                    </span>
                    {stylistId === s._id && (
                      <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[#17191c]">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Step>
        )}

        {serviceId && stylistId && (
          <Step icon={Clock} title="Elige día y hora">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {days.map((iso) => {
                const { weekday, day, month } = dayParts(iso);
                const selected = iso === date;
                return (
                  <button
                    key={iso}
                    onClick={() => setDate(iso)}
                    aria-pressed={selected}
                    className={`flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 transition ${
                      selected
                        ? "border-ink bg-ink text-cream"
                        : "border-sand hover:border-gold"
                    }`}
                  >
                    <span className="text-xs uppercase">{iso === today ? "Hoy" : weekday}</span>
                    <span className="font-display text-xl">{day}</span>
                    <span className="text-xs opacity-70">{month}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="otra-fecha" className="text-sm text-ink/70">
                Otra fecha:
              </label>
              <input
                id="otra-fecha"
                type="date"
                className="input max-w-44"
                value={date}
                min={today}
                onChange={(e) => e.target.value && setDate(e.target.value)}
              />
            </div>

            <div className="mt-2 min-h-24">
              {loadingSlots && slots.length === 0 && (
                <p className="mt-4 flex items-center gap-2 text-ink/60">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Buscando huecos...
                </p>
              )}

              {!loadingSlots && slots.length === 0 && (
                <div className="mt-4 flex flex-col items-center rounded-xl bg-sand/40 px-4 py-8 text-center">
                  <CalendarX className="h-8 w-8 text-ink/40" aria-hidden="true" />
                  <p className="mt-2 font-medium">No hay huecos libres este día</p>
                  <p className="text-sm text-ink/70">
                    Prueba con otra fecha u otro {terms.one}.
                  </p>
                </div>
              )}

              <SlotGroup title="Mañana" icon={Sun} slots={morning} onPick={reserve} />
              <SlotGroup title="Tarde" icon={Moon} slots={afternoon} onPick={reserve} />
            </div>
          </Step>
        )}
      </div>
    </div>
  );
}