import type { PhotoMeta } from "@/features/photos/types"

/**
 * 与磁盘目录结构一致的相册节点。
 * `photos` 只包含该目录直接存放的图片，子目录放在 `children` 中。
 */
export interface AlbumNode {
  id: string
  name: string
  path: string
  photos: PhotoMeta[]
  children: AlbumNode[]
  /** 该目录直接包含的图片数量。 */
  photoCount: number
  /** 该目录及其所有子目录的图片总数量。 */
  totalPhotoCount: number
}

/** 单个图库目录的扫描结果，error 存在时表示该目录本次扫描失败。 */
export interface RootScan {
  root: string
  node?: AlbumNode | null
  error?: string
}

export interface LibraryScan {
  roots: RootScan[]
  totalPhotos: number
  totalAlbums: number
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

/** 合并了本地元数据（标题、封面、收藏、隐藏）后的相册。 */
export interface EffectiveAlbum {
  id: string
  root: string
  name: string
  path: string
  photos: PhotoMeta[]
  title: string
  description: string | null
  cover: PhotoMeta | null
  favorite: boolean
  hidden: boolean
}

export interface EffectiveAlbumNode extends EffectiveAlbum {
  children: EffectiveAlbumNode[]
  totalPhotoCount: number
}

/** 一个图库目录及其相册树。 */
export interface LibraryRootTree {
  root: string
  album: EffectiveAlbumNode | null
  error: string | null
}

export interface AddRootsResult {
  added: number
  skipped: number
  replaced: number
  cancelled: boolean
}
