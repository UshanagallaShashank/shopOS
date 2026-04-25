// Storefront template definitions — each template is a full CSS variable override set.
// Values follow the shadcn/ui convention: HSL components only, no hsl() wrapper.
// Example: "222 47% 6%" not "hsl(222, 47%, 6%)"

export type TemplateId =
  | "dark_edge"
  | "minimal"
  | "boutique"
  | "bold"
  | "forest"

export interface TemplateDef {
  id: TemplateId
  name: string
  tagline: string
  // colours for the picker card preview
  previewBg: string
  previewCard: string
  previewAccent: string
  previewText: string
  // CSS variable overrides applied as inline styles on the storefront wrapper
  vars: {
    background: string
    foreground: string
    card: string
    "card-foreground": string
    primary: string
    "primary-foreground": string
    secondary: string
    "secondary-foreground": string
    muted: string
    "muted-foreground": string
    accent: string
    "accent-foreground": string
    border: string
    input: string
    ring: string
    radius: string
  }
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "dark_edge",
    name: "Dark Edge",
    tagline: "Sleek dark theme with electric red",
    previewBg: "#0b0f1a",
    previewCard: "#111827",
    previewAccent: "#E94560",
    previewText: "#f8fafc",
    vars: {
      background: "222 47% 6%",
      foreground: "210 40% 98%",
      card: "222 47% 9%",
      "card-foreground": "210 40% 98%",
      primary: "351 78% 57%",
      "primary-foreground": "0 0% 100%",
      secondary: "217 32% 13%",
      "secondary-foreground": "210 40% 98%",
      muted: "217 32% 13%",
      "muted-foreground": "215 20% 55%",
      accent: "217 32% 13%",
      "accent-foreground": "210 40% 98%",
      border: "217 32% 15%",
      input: "217 32% 13%",
      ring: "351 78% 57%",
      radius: "0.75rem",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    tagline: "Clean white canvas, zero distraction",
    previewBg: "#ffffff",
    previewCard: "#f9fafb",
    previewAccent: "#4F46E5",
    previewText: "#111827",
    vars: {
      background: "0 0% 100%",
      foreground: "222 47% 11%",
      card: "0 0% 98%",
      "card-foreground": "222 47% 11%",
      primary: "243 75% 59%",
      "primary-foreground": "0 0% 100%",
      secondary: "220 14% 96%",
      "secondary-foreground": "222 47% 20%",
      muted: "220 14% 96%",
      "muted-foreground": "220 8% 46%",
      accent: "220 14% 94%",
      "accent-foreground": "222 47% 11%",
      border: "220 13% 91%",
      input: "220 13% 91%",
      ring: "243 75% 59%",
      radius: "0.5rem",
    },
  },
  {
    id: "boutique",
    name: "Boutique",
    tagline: "Warm & elegant for fashion and lifestyle",
    previewBg: "#fdf6ee",
    previewCard: "#ffffff",
    previewAccent: "#c0392b",
    previewText: "#2c1810",
    vars: {
      background: "36 50% 96%",
      foreground: "20 14% 13%",
      card: "0 0% 100%",
      "card-foreground": "20 14% 13%",
      primary: "355 72% 55%",
      "primary-foreground": "0 0% 100%",
      secondary: "36 30% 92%",
      "secondary-foreground": "20 14% 25%",
      muted: "36 25% 91%",
      "muted-foreground": "20 10% 45%",
      accent: "36 35% 88%",
      "accent-foreground": "20 14% 13%",
      border: "36 20% 85%",
      input: "36 20% 89%",
      ring: "355 72% 55%",
      radius: "1rem",
    },
  },
  {
    id: "bold",
    name: "Bold",
    tagline: "High-contrast blue for tech & electronics",
    previewBg: "#f0f4ff",
    previewCard: "#ffffff",
    previewAccent: "#2563EB",
    previewText: "#0f172a",
    vars: {
      background: "220 30% 97%",
      foreground: "220 47% 9%",
      card: "0 0% 100%",
      "card-foreground": "220 47% 9%",
      primary: "217 91% 60%",
      "primary-foreground": "0 0% 100%",
      secondary: "220 20% 93%",
      "secondary-foreground": "220 47% 20%",
      muted: "220 14% 93%",
      "muted-foreground": "220 10% 46%",
      accent: "220 20% 90%",
      "accent-foreground": "220 47% 9%",
      border: "220 13% 87%",
      input: "220 13% 88%",
      ring: "217 91% 60%",
      radius: "0.625rem",
    },
  },
  {
    id: "forest",
    name: "Forest",
    tagline: "Dark & natural for organic and eco brands",
    previewBg: "#0a1a12",
    previewCard: "#0f2018",
    previewAccent: "#22c55e",
    previewText: "#e8f5ee",
    vars: {
      background: "150 30% 7%",
      foreground: "150 20% 92%",
      card: "150 25% 11%",
      "card-foreground": "150 20% 92%",
      primary: "152 69% 45%",
      "primary-foreground": "150 30% 7%",
      secondary: "150 20% 16%",
      "secondary-foreground": "150 20% 85%",
      muted: "150 18% 16%",
      "muted-foreground": "150 12% 55%",
      accent: "150 20% 15%",
      "accent-foreground": "150 20% 92%",
      border: "150 18% 18%",
      input: "150 18% 16%",
      ring: "152 69% 45%",
      radius: "0.75rem",
    },
  },
]

export const DEFAULT_TEMPLATE_ID: TemplateId = "dark_edge"

export function getTemplate(id: string | null | undefined): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

// Preset primary colours that org_admin can choose as accent overrides.
// Each entry has a hex value and its HSL components (for CSS variable injection).
export const PRIMARY_COLORS = [
  { hex: "#E94560", hsl: "351 78% 57%", name: "Electric Red" },
  { hex: "#4F46E5", hsl: "243 75% 59%", name: "Indigo" },
  { hex: "#2563EB", hsl: "217 91% 60%", name: "Blue" },
  { hex: "#0891B2", hsl: "191 97% 36%", name: "Cyan" },
  { hex: "#16A34A", hsl: "142 71% 45%", name: "Green" },
  { hex: "#CA8A04", hsl: "43 96% 40%", name: "Amber" },
  { hex: "#EA580C", hsl: "21 90% 48%", name: "Orange" },
  { hex: "#DB2777", hsl: "329 86% 50%", name: "Pink" },
  { hex: "#7C3AED", hsl: "263 70% 58%", name: "Violet" },
  { hex: "#64748B", hsl: "215 16% 47%", name: "Slate" },
]

export function hexToHsl(hex: string): string | null {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}
