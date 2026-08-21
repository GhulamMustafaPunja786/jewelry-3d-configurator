import type { CategoryAvailability } from "@/types/jewelry";

export const CATEGORIES: CategoryAvailability[] = [
  {
    id: "ring",
    label: "Rings",
    description: "Engagement, wedding, and statement bands via AI design.",
    available: true,
    href: "/create?type=ring",
  },
  {
    id: "necklace",
    label: "Necklaces",
    description: "Collar and layered pieces shaped from your description.",
    available: true,
    href: "/create?type=necklace",
  },
  {
    id: "chain",
    label: "Chains",
    description: "Link chains and wearable strands in precious metals.",
    available: true,
    href: "/create?type=chain",
  },
  {
    id: "bracelet",
    label: "Bracelets",
    description: "Cuffs and link bracelets generated from your brief.",
    available: true,
    href: "/create?type=bracelet",
  },
  {
    id: "earrings",
    label: "Earrings",
    description: "Studs, drops, and sculptural pairs.",
    available: true,
    href: "/create?type=earrings",
  },
  {
    id: "pendant",
    label: "Pendants",
    description: "Solitaires, charms, and focal pendants.",
    available: true,
    href: "/create?type=pendant",
  },
];
