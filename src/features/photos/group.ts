import type { PhotoMeta, SortKey } from "./types"
import { sortPhotos } from "./sort"

export interface PhotoGroup {
  key: string
  label: string
  photos: PhotoMeta[]
}

const UNKNOWN_KEY = "unknown"
const DAY_MS = 86_400_000

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function dayLabel(ms: number) {
  const date = new Date(ms)
  const now = new Date()
  const diffDays = Math.round((startOfLocalDay(now) - startOfLocalDay(date)) / DAY_MS)

  if (diffDays === 0) return "今天"
  if (diffDays === 1) return "昨天"

  const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`
  return date.getFullYear() === now.getFullYear()
    ? monthDay
    : `${date.getFullYear()}年${monthDay}`
}

/**
 * Groups photos by local day (newest first) using the file modification time.
 * The provided sortKey controls the ordering within each day group.
 */
export function groupPhotosByDate(
  photos: PhotoMeta[],
  sortKey: SortKey
): PhotoGroup[] {
  const sorted = [...photos].sort(
    (a, b) => (b.modified ?? 0) - (a.modified ?? 0)
  )

  const groups: PhotoGroup[] = []
  let currentKey: string | null = null

  for (const photo of sorted) {
    const hasDate = photo.modified != null
    const key = hasDate
      ? String(startOfLocalDay(new Date(photo.modified as number)))
      : UNKNOWN_KEY

    if (key !== currentKey) {
      groups.push({
        key,
        label: hasDate ? dayLabel(photo.modified as number) : "未知日期",
        photos: [],
      })
      currentKey = key
    }

    groups[groups.length - 1].photos.push(photo)
  }

  for (const group of groups) {
    group.photos = sortPhotos(group.photos, sortKey)
  }

  return groups
}
