// cn() merges Tailwind classes safely — use this instead of template strings
// clsx handles conditionals, tailwind-merge removes conflicting classes
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
