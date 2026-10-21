import { useState } from "react";

export default function Landing() {
  const [slug, setSlug] = useState("");

  function goToSalon(e) {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();
    if (clean) window.location.href = `/s/${clean}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <section className="rounded-2xl bg-ink px-6 py-14 text-center text-cream sm:py-20">
        <p className="text-sm uppercase tracking-[0.3em] text-gold">Gestión de citas</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-bold sm:text-5xl">
          Las reservas de tu peluquería, en tiempo real
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-cream/70">
          Crea tu peluquería, da de alta a tu equipo y comparte el enlace con tus clientes.
        </p>
        <a
          href="/crear-peluqueria"
          className="mt-8 inline-flex rounded-lg bg-gold px-6 py-3 font-medium text-ink transition hover:bg-cream"
        >
          Crear mi peluquería
        </a>
      </section>

      <form onSubmit={goToSalon} className="card mt-8">
        <h2 className="text-xl font-semibold">¿Ya tienes una peluquería?</h2>
        <p className="mt-1 text-sm text-ink/60">Escribe su dirección para entrar.</p>
        <div className="mt-4 flex gap-2">
          <span className="flex items-center text-sm text-ink/50">/s/</span>
          <input
            className="input"
            placeholder="peluqueria-lola"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <button className="btn-primary">Entrar</button>
        </div>
      </form>
    </div>
  );
}