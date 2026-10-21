// El salón activo sale de la URL: /s/<slug>/...
const match = window.location.pathname.match(/^\/s\/([a-z0-9-]+)/);

export const SALON_SLUG = match ? match[1] : null;
export const BASENAME = SALON_SLUG ? `/s/${SALON_SLUG}` : "/";

// La sesión se guarda por peluquería: entrar en una no abre la otra
export const TOKEN_KEY = `token:${SALON_SLUG}`;
export const USER_KEY = `user:${SALON_SLUG}`;