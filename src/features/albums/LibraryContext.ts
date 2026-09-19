import { createContext, useContext } from "react"
import type { EffectiveAlbum, LibraryRootTree } from "./types"
import type { PhotoMeta, SortKey } from "@/features/photos/types"

export interface LibraryContextValue {
  /** 已添加的全部图库目录。 */
  roots: string[]
  /** 每个图库目录的相册树（与磁盘目录结构一致）。 */
  tree: LibraryRootTree[]
  /** 拍平后的相册列表，便于按 id 查找。 */
  albums: EffectiveAlbum[]
  allPhotos: PhotoMeta[]
  sortKey: SortKey
  setSortKey: (key: SortKey) => void
  loading: boolean
  error: string | null
  addRoots: () => Promise<void>
  removeRoot: (root: string) => Promise<void>
  reload: () => Promise<void>
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
