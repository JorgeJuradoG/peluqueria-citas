import { Crown, Flower2, Gem, Scissors, Sparkles, Star } from "lucide-react";

export const BRAND_ICONS = {
  scissors: { icon: Scissors, label: "Tijeras" },
  sparkles: { icon: Sparkles, label: "Destellos" },
  crown: { icon: Crown, label: "Corona" },
  flower: { icon: Flower2, label: "Flor" },
  gem: { icon: Gem, label: "Gema" },
  star: { icon: Star, label: "Estrella" },
};

export default function BrandIcon({ name, ...props }) {
  const { icon: Icon } = BRAND_ICONS[name] ?? BRAND_ICONS.scissors;
  return <Icon {...props} />;
}