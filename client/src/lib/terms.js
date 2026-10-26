export const STAFF_TERMS = {
  estilista: { one: "estilista", many: "estilistas" },
  barbero: { one: "barbero", many: "barberos" },
  profesional: { one: "profesional", many: "profesionales" },
};
export const DEFAULT_STAFF_TERM = "estilista";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// { one, many, One, Many }: singular y plural, en minúscula y con inicial mayúscula
export function termsFor(key) {
  const t = STAFF_TERMS[key] ?? STAFF_TERMS[DEFAULT_STAFF_TERM];
  return { ...t, One: cap(t.one), Many: cap(t.many) };
}