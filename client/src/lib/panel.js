// Rutas que se abren dentro del panel de gestión (solo para equipo y dueño)
const PANEL_PREFIXES = ["/inicio", "/agenda", "/perfil", "/admin"];

export function isPanelPath(pathname, user) {
  if (!user || user.role === "client") return false;
  return PANEL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
