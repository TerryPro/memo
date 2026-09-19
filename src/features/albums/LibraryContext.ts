import { createContext, useContext } from "react"
import type { EffectiveAlbum } from "./types"
import type { PhotoMeta, SortKey } from "@/features/photos/types"

export interface LibraryContextValue {
  root: string | null
  albums: EffectiveAlbum[]
  allPhotos: PhotoMeta[]
  sortKey: SortKey
  setSortKey: (key: SortKey) => void
  loading: boolean
  error: string | null
  openLibrary: () => Promise<void>
  getAlbum: (id: string) => EffectiveAlbum | undefined
  rename: (id: string, title: string) => Promise<void>
  setDescription: (id: string, description: string) => Promise<void>
  setCover: (id: string, coverPath: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  toggleHidden: (id: string) => Promise<void>
}

export const LibraryContext = createContext<LibraryContextValue | null>(null)

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider")
  }
  return context
}
