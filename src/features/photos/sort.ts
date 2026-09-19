import type { PhotoMeta, SortKey } from "./types"

export function sortPhotos(photos: PhotoMeta[], sortKey: SortKey): PhotoMeta[] {
  const copy = [...photos]
  switch (sortKey) {
    case "date":
      copy.sort((a, b) => (b.modified ?? 0) - (a.modified ?? 0))
      break
    case "size":
      copy.sort((a, b) => b.size - a.size)
      break
    case "name":
    default:
      copy.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  return copy
}
