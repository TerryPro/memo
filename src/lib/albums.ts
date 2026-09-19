import { trackedInvoke } from "@/lib/tauri"
import type { AlbumMeta, LibraryScan } from "@/features/albums/types"

export function scanLibrary(roots: string[]) {
  return trackedInvoke<LibraryScan>("scan_library", { roots })
}

export function loadAlbumMeta() {
  return trackedInvoke<AlbumMeta[]>("load_album_meta")
}

export function saveAlbumMeta(albums: AlbumMeta[]) {
  return trackedInvoke<void>("save_album_meta", { albums })
}

export function loadLibraryRoots() {
  return trackedInvoke<string[]>("load_library_roots")
}

export function saveLibraryRoots(roots: string[]) {
  return trackedInvoke<void>("save_library_roots", { roots })
}
