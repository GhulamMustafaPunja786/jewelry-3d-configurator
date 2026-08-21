import type { CategoryAvailability } from "@/types/jewelry";

export const CATEGORIES: CategoryAvailability[] = [
  {
    id: "ring",
    label: "Rings",
    description: "Engagement, wedding, and statement bands with live 3D preview.",
    available: true,
    href: "/design?category=ring",
  },
  {
    id: "necklace",
    label: "Necklaces",
    description: "Chains and collar pieces — coming soon.",
    available: false,
    href: "/design?category=necklace",
  },
  {
    id: "bracelet",
    label: "Bracelets",
    description: "Cuffs and link bracelets — coming soon.",
    available: false,
    href: "/design?category=bracelet",
  },
  {
    id: "earrings",
    label: "Earrings",
    description: "Studs and drops — coming soon.",
    available: false,
    href: "/design?category=earrings",
  },
  {
    id: "pendant",
    label: "Pendants",
    description: "Solitaires and charms — coming soon.",
    available: false,
    href: "/design?category=pendant",
  },
];
