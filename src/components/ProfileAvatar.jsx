import { Crosshair, Shield, Star } from "lucide-react";

export const avatarOptions = [
  ["initial", "Inicial"],
  ["crosshair", "Mira"],
  ["shield", "Escudo"],
  ["star", "Estrella"],
];

const icons = { crosshair: Crosshair, shield: Shield, star: Star };

export default function ProfileAvatar({ name, avatar }) {
  const Icon = icons[avatar];
  return (
    <span className={`avatar avatar-${Icon ? avatar : "initial"}`} aria-hidden="true">
      {Icon ? <Icon size="56%" /> : name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}
