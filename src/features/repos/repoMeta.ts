import type { RepoSortKey, RepoStatus } from "./types"

export const STATUS_ORDER: Record<RepoStatus, number> = {
  watching: 0,
  evaluating: 1,
  archived: 2,
}

export const STATUS_LABELS: Record<RepoStatus, string> = {
  watching: "关注中",
  evaluating: "待评估",
  archived: "已归档",
}

export const STATUS_OPTIONS: RepoStatus[] = ["watching", "evaluating", "archived"]

interface StatusStyle {
  label: string
  badge: string
}

export const STATUS_STYLES: Record<RepoStatus, StatusStyle> = {
  watching: {
    label: "关注中",
    badge:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  evaluating: {
    label: "待评估",
    badge:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  archived: {
    label: "已归档",
    badge: "border-transparent bg-muted text-muted-foreground",
  },
}

export const SORT_ITEMS: { label: string; value: RepoSortKey }[] = [
  { label: "手动排序", value: "manual" },
  { label: "按名称", value: "name" },
  { label: "按 Stars", value: "stars" },
  { label: "按最近推送", value: "pushed" },
  { label: "按最近更新", value: "updated" },
]

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

export function formatCount(value: number | null): string {
  if (value === null) return "—"
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

export function formatDate(ms: number | null): string {
  if (ms === null) return "—"
  const date = new Date(ms)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatRelativeTime(ms: number | null): string {
  if (ms === null) return "—"

  const diff = Date.now() - ms
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} 分钟前`
  if (diff < day) return `${Math.round(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.round(diff / day)} 天前`
  if (diff < 365 * day) return `${Math.round(diff / (30 * day))} 个月前`
  return `${Math.round(diff / (365 * day))} 年前`
}

export function formatResetTime(reset: number): string {
  if (!reset) return "未知"
  const date = new Date(reset * 1000)
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function githubRepoUrl(owner: string, name: string): string {
  return `https://github.com/${owner}/${name}`
}

export function githubIssuesUrl(owner: string, name: string): string {
  return `https://github.com/${owner}/${name}/issues`
}

export function githubReleasesUrl(owner: string, name: string): string {
  return `https://github.com/${owner}/${name}/releases`
}

export function parseRepoInput(
  input: string
): { owner: string; name: string } | null {
  if (!input) return null

  let value = input
    .trim()
    .replace(/^git\+/, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/^ssh:\/\/git@github\.com\//i, "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^github\.com\//i, "")

  value = value.split(/[?#]/)[0]
  value = value.replace(/\.git$/i, "").replace(/\/+$/, "").replace(/^\/+/, "")

  const parts = value.split("/").filter(Boolean)
  if (parts.length < 2) return null

  const [owner, name] = parts
  const valid = /^[\w.-]+$/
  if (!valid.test(owner) || !valid.test(name)) return null

  return { owner, name }
}
