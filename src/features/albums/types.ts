import type { PhotoMeta } from "@/features/photos/types"

export interface AlbumGroup {
  id: string
  name: string
  path: string
  photos: PhotoMeta[]
}

export interface LibraryScan {
  root: string
  albums: AlbumGroup[]
}

export interface AlbumMeta {
  id: string
  title?: string
  description?: string
  coverPath?: string
  favorite?: boolean
  hidden?: boolean
  position?: number
  updatedAt?: number
}

export interface EffectiveAlbum {
  id: string
  name: string
  path: string
  photos: PhotoMeta[]
  title: string
  description: string | null
  cover: PhotoMeta | null
  favorite: boolean
  hidden: boolean
}
