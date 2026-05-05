export type Family =
  | "citrus"
  | "floral"
  | "green"
  | "spice"
  | "wood"
  | "resin"
  | "musk"
  | "aquatic"
  | "gourmand"
  | "animalic";

export type Role = "top" | "heart" | "base";

export interface FamilyMeta {
  id: Family;
  label: string;
  shortLabel: string;
  hex: string;
  description: string;
}

export const FAMILIES: Record<Family, FamilyMeta> = {
  citrus: {
    id: "citrus",
    label: "Citrus",
    shortLabel: "CIT",
    hex: "#E8C84A",
    description: "Bright, volatile, sun-bleached. Open the composition.",
  },
  floral: {
    id: "floral",
    label: "Floral",
    shortLabel: "FLO",
    hex: "#E89BB0",
    description: "The body of most fine fragrance. Range from indolic to powdery to fresh.",
  },
  green: {
    id: "green",
    label: "Green",
    shortLabel: "GRN",
    hex: "#8AA876",
    description: "Crushed leaf, wet stem, bitter sap. Sharpens what they touch.",
  },
  spice: {
    id: "spice",
    label: "Spice",
    shortLabel: "SPC",
    hex: "#B85C2E",
    description: "Warm, dry, complex. Used to add tension or warmth.",
  },
  wood: {
    id: "wood",
    label: "Wood",
    shortLabel: "WOD",
    hex: "#6B4A2E",
    description: "Structure. The bones of a base. Range from dry to creamy.",
  },
  resin: {
    id: "resin",
    label: "Resin",
    shortLabel: "RES",
    hex: "#8B5A3C",
    description: "Smoke, balsam, church. Density and gravitas.",
  },
  musk: {
    id: "musk",
    label: "Musk / Specialty",
    shortLabel: "MSK",
    hex: "#A89884",
    description: "Skin, radiance, longevity. Modern perfumery is built on these.",
  },
  aquatic: {
    id: "aquatic",
    label: "Aquatic",
    shortLabel: "AQU",
    hex: "#6B98A8",
    description: "Ozone, sea spray, melon-rind. Use sparingly or it tips into laundry detergent.",
  },
  gourmand: {
    id: "gourmand",
    label: "Gourmand",
    shortLabel: "GMD",
    hex: "#C49968",
    description: "Edible warmth: vanilla, sugar, tobacco, almond. Polarizing in fine fragrance.",
  },
  animalic: {
    id: "animalic",
    label: "Animalic",
    shortLabel: "ANM",
    hex: "#7C5A4A",
    description:
      "Fur, sweat, leather. Always synthetic substitutes now. A drop transforms the whole.",
  },
};

export const familyColor = (f: Family): string => FAMILIES[f].hex;

export const ROLE_LABEL: Record<Role, string> = {
  top: "Top",
  heart: "Heart",
  base: "Base",
};

export const ROLE_VOLATILITY_RANGE: Record<Role, { min: number; max: number }> = {
  top: { min: 0.85, max: 1.0 },
  heart: { min: 0.4, max: 0.7 },
  base: { min: 0.05, max: 0.3 },
};

export const ROLE_DEFAULT_PERCENT_RANGE: Record<Role, { min: number; max: number }> = {
  top: { min: 1, max: 8 },
  heart: { min: 5, max: 15 },
  base: { min: 1, max: 6 },
};
