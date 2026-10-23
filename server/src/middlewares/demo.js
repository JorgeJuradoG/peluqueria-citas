const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
// Lo único que se puede enviar por POST a una demo: iniciar sesión
const ALLOWED_POSTS = new Set(["/api/auth/login", "/api/auth/demo"]);

export function demoGuard(req, res, next) {
  if (!req.salon?.demo) return next();
  if (SAFE.has(req.method)) return next();
  if (req.method === "POST" && ALLOWED_POSTS.has(req.baseUrl + req.path)) return next();

  res.status(403).json({
    message:
      "Esto es una demo de solo lectura: los cambios no se guardan. Crea tu peluquería para probarlo de verdad.",
  });
}