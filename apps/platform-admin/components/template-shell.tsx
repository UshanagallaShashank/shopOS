"use client"
// Wraps storefront pages in a scoped CSS variable context matching the org's chosen template.
// Tailwind utility classes (bg-background, text-primary, etc.) inside this wrapper will
// resolve to the template's palette rather than the global dark admin theme.
import type { CSSProperties, ReactNode } from "react"
import { getTemplate, hexToHsl } from "@/lib/templates"
import type { Org } from "@/lib/types"

interface TemplateShellProps {
  org: Org | undefined
  children: ReactNode
  // fullBleed: negates parent p-8 so the template background fills edge-to-edge
  fullBleed?: boolean
  className?: string
}

export function TemplateShell({ org, children, fullBleed = true, className }: TemplateShellProps) {
  const tpl = getTemplate(org?.ui_template)

  // Build the inline style object — each CSS var key gets the template value,
  // then optionally override --primary / --ring if org has a custom primary_color.
  const style: CSSProperties = {}
  for (const [key, val] of Object.entries(tpl.vars)) {
    // @ts-expect-error — dynamic CSS custom property assignment
    style[`--${key}`] = val
  }

  const customPrimary = org?.primary_color
    ? hexToHsl(org.primary_color)
    : null

  if (customPrimary) {
    // @ts-expect-error
    style["--primary"] = customPrimary
    // @ts-expect-error
    style["--ring"] = customPrimary
    // Light colours need dark foreground; rough luminance check via L in HSL
    const l = parseInt(customPrimary.split(" ")[2] ?? "50") // "60%" → 60
    // @ts-expect-error
    style["--primary-foreground"] = l > 55 ? "220 47% 9%" : "0 0% 100%"
  }

  // -m-8 negates the parent layout's p-8 so the template background fills edge-to-edge
  const bleedClass = fullBleed ? "-m-8" : ""

  return (
    <div
      style={style}
      className={`${bleedClass} ${className ?? ""}`.trim()}
      data-template={tpl.id}
    >
      {children}
    </div>
  )
}
