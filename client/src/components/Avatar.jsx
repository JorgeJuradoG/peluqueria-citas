const COLORS = [
  "#7c2d12", "#065f46", "#1e40af", "#6b21a8",
  "#9f1239", "#115e59", "#92400e", "#3f3f46",
];

const SIZES = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-2xl",
};

function hash(text) {
  let h = 0;
  for (const ch of String(text)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

// Decorativo: el nombre ya aparece escrito al lado, así que se oculta a los lectores de pantalla
export default function Avatar({ name = "", size = "md", className = "" }) {
  const initial = ([...String(name).trim()][0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: COLORS[hash(name) % COLORS.length] }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display text-white ${SIZES[size] ?? SIZES.md} ${className}`}
    >
      {initial}
    </span>
  );
}