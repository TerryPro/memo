import { trackedInvoke } from "@/lib/tauri"
import type { ExifData } from "@/features/photos/types"

export function readExif(path: string) {
  return trackedInvoke<ExifData>("read_exif", { path })
}
