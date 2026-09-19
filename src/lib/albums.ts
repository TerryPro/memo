import { trackedInvoke } from "@/lib/tauri"
import type { AlbumMeta, LibraryScan } from "@/features/albums/types"

export function scanLibrary(root: string) {
  return trackedInvoke<LibraryScan>("scan_library", { root })
}

export function loadAlbumMeta() {
  return trackedInvoke<AlbumMeta[]>("load_album_meta")
}

export function saveAlbumMeta(albums: AlbumMeta[]) {
  return trackedInvoke<void>("save_album_meta", { albums })
}

export function loadLibraryRoot() {
  return trackedInvoke<string | null>("load_library_root")
}

export function saveLibraryRoot(root: string | null) {
  return trackedInvoke<void>("save_library_root", { root })
}
