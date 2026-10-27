import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Store, X } from "lucide-react";
import BrandIcon from "../BrandIcon";
import ThemeToggle from "../ThemeToggle";
import { CONTACT_EMAIL, DEMO_SLUG, NAV, PRODUCT_NAME } from "../../lib/brand";

export default function PlatformLayout({ children }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
      >
        Saltar al contenido
      </a>

      <header
        className={`sticky top-0 z-30 border-b border-sand bg-cream/90 backdrop-blur transition-shadow ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            <BrandIcon name="scissors" className="h-5 w-5 text-gold" aria-hidden="true" />
            {PRODUCT_NAME}
            <span className="text-gold">.</span>
          </Link>

          {/* En la cabecera solo los enlaces principales; el resto va en el menú móvil y en el pie */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {NAV.filter((n) => !n.secondary).map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="whitespace-nowrap rounded-full px-3 py-2 text-sm text-ink/70 transition hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/entrar"
              className="hidden rounded-full px-3 py-2 text-sm text-ink/80 transition hover:text-ink md:inline-flex"
            >
              Entrar
            </Link>
            <a href={`/s/${DEMO_SLUG}`} className="btn-outline hidden sm:inline-flex">
              Ver demo
            </a>
            <Link to="/crear-peluqueria" className="btn-primary">
              <Store className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Crear mi peluquería</span>
              <span className="sm:hidden">Crear</span>
            </Link>
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="rounded-lg border border-sand bg-surface p-2 transition hover:border-gold lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="animate-fade-up border-t border-sand bg-cream lg:hidden" aria-label="Menú móvil">
            <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
              {NAV.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-ink/80 transition hover:bg-sand/60"
                >
                  {label}
                </a>
              ))}
              <a
                href={`/s/${DEMO_SLUG}`}
                className="block rounded-lg px-3 py-3 text-base font-medium text-ink/80 transition hover:bg-sand/60"
              >
                Ver demo
              </a>
              <Link
                to="/entrar"
                className="block rounded-lg px-3 py-3 text-base font-medium text-ink/80 transition hover:bg-sand/60"
              >
                Entrar en mi peluquería
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main id="contenido" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-sand">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-ink/70 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <BrandIcon name="scissors" className="h-4 w-4 text-gold" aria-hidden="true" />
              {PRODUCT_NAME}
              <span className="text-gold">.</span>
            </p>
            <p className="mt-2 max-w-xs">
              Reservas online en tiempo real para peluquerías y barberías.
            </p>
          </div>

          <div>
            <p className="font-semibold text-ink">Producto</p>
            <ul className="mt-3 space-y-2">
              {NAV.slice(0, 4).map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="transition hover:text-gold-dark">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-ink">Empieza</p>
            <ul className="mt-3 space-y-2">
              <li><Link to="/crear-peluqueria" className="transition hover:text-gold-dark">Crear mi peluquería</Link></li>
              <li><Link to="/entrar" className="transition hover:text-gold-dark">Entrar</Link></li>
              <li><a href={`/s/${DEMO_SLUG}`} className="transition hover:text-gold-dark">Ver demo</a></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-gold-dark">Contacto</a></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-ink">Legal</p>
            <ul className="mt-3 space-y-2">
              <li><Link to="/privacidad" className="transition hover:text-gold-dark">Privacidad</Link></li>
              <li><Link to="/terminos" className="transition hover:text-gold-dark">Términos de uso</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sand">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink/60">
            © {new Date().getFullYear()} {PRODUCT_NAME}. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}