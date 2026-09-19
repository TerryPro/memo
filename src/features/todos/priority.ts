import type { TodoPriority } from "./types"

export const PRIORITY_ORDER: Record<TodoPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
}

export const PRIORITY_LABELS: Record<TodoPriority, string> = {
  none: "无",
  low: "低",
  medium: "中",
  high: "高",
}

export const PRIORITY_OPTIONS: TodoPriority[] = [
  "none",
  "low",
  "medium",
  "high",
]

interface PriorityStyle {
  label: string
  badge: string
  dot: string
}

export const PRIORITY_STYLES: Record<TodoPriority, PriorityStyle> = {
  none: {
    label: "无优先级",
    badge: "border-transparent bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  low: {
    label: "低优先级",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  medium: {
    label: "中优先级",
    badge:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  high: {
    label: "高优先级",
    badge: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function daysUntil(iso: string): number {
  const today = parseISODate(todayISO()).getTime()
  const target = parseISODate(iso).getTime()
  return Math.round((target - today) / 86_400_000)
}

export function isOverdue(iso: string | null, completed: boolean): boolean {
  if (!iso || completed) return false
  return iso < todayISO()
}

export function isDueToday(iso: string | null): boolean {
  return iso !== null && iso === todayISO()
}

export function isUpcoming(iso: string | null): boolean {
  if (!iso) return false
  const diff = daysUntil(iso)
  return diff >= 0 && diff <= 7
}

export function formatDueDate(iso: string | null): string | null {
  if (!iso) return null
  const diff = daysUntil(iso)
  if (diff === 0) return "今天"
  if (diff === 1) return "明天"
  if (diff === 2) return "后天"
  if (diff === -1) return "昨天"
  const date = parseISODate(iso)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
