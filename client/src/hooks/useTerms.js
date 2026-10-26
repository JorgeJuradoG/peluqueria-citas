import { useMemo } from "react";
import { useSalon } from "../context/SalonContext";
import { termsFor } from "../lib/terms";

export default function useTerms() {
  const salon = useSalon();
  return useMemo(() => termsFor(salon?.staffTerm), [salon?.staffTerm]);
}