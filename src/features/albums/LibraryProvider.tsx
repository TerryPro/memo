import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { open } from "@tauri-apps/plugin-dialog"
import {
  loadAlbumMeta,
  loadLibraryRoot,
  saveAlbumMeta,
  saveLibraryRoot,
  scanLibrary,
} from "@/lib/albums"
import { LibraryContext } from "./LibraryContext"
import type { AlbumGroup, AlbumMeta, EffectiveAlbum } from "./types"
import type { SortKey } from "@/features/photos/types"

function mergeAlbums(
  groups: AlbumGroup[],
  metaMap: Map<string, AlbumMeta>
): EffectiveAlbum[] {
  return groups.map((group) => {
    const meta = metaMap.get(group.id)
    const coverFromMeta = meta?.coverPath
      ? group.photos.find((photo) => photo.path === meta.coverPath)
      : undefined
    const cover = coverFromMeta ?? group.photos[0] ?? null

    return {
      id: group.id,
      name: group.name,
      path: group.path,
      photos: group.photos,
      title: meta?.title?.trim() ? meta.title : group.name,
      description: meta?.description ?? null,
      cover,
      favorite: meta?.favorite ?? false,
      hidden: meta?.hidden ?? false,
    }
  })
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<string | null>(null)
  const [groups, setGroups] = useState<AlbumGroup[]>([])
  const [metaMap, setMetaMap] = useState<Map<string, AlbumMeta>>(
    () => new Map()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("name")

  const albums = useMemo(() => mergeAlbums(groups, metaMap), [groups, metaMap])

  const allPhotos = useMemo(
    () => groups.flatMap((group) => group.photos),
    [groups]
  )

  const updateMeta = useCallback(
    async (id: string, patch: Partial<AlbumMeta>) => {
      const next = new Map(metaMap)
      const existing = next.get(id) ?? { id }
      next.set(id, { ...existing, ...patch, id, updatedAt: Date.now() })
      setMetaMap(next)
      await saveAlbumMeta(Array.from(next.values()))
    },
    [metaMap]
  )

  const loadIntoLibrary = useCallback(async (dir: string) => {
    setLoading(true)
    try {
      const [scan, metas] = await Promise.all([
        scanLibrary(dir),
        loadAlbumMeta(),
      ])
      const map = new Map<string, AlbumMeta>()
      for (const meta of metas) map.set(meta.id, meta)

      setRoot(scan.root)
      setGroups(scan.albums)
      setMetaMap(map)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const openLibrary = useCallback(async () => {
    setError(null)
    try {
      const selected = await open({ directory: true, multiple: false })
      if (typeof selected !== "string") return

      await loadIntoLibrary(selected)
      await saveLibraryRoot(selected)
    } catch (err) {
      setError(String(err))
    }
  }, [loadIntoLibrary])

  useEffect(() => {
    let cancelled = false

    loadLibraryRoot()
      .then((saved) => {
        if (cancelled || !saved) return
        return loadIntoLibrary(saved)
      })
      .catch((err) => {
        if (cancelled) return
        setError(String(err))
        // 记住的目录可能已被移动或删除，清除记忆以免每次启动都失败
        void saveLibraryRoot(null)
      })

    return () => {
      cancelled = true
    }
  }, [loadIntoLibrary])

  const getAlbum = useCallback(
    (id: string) => albums.find((album) => album.id === id),
    [albums]
  )

  const rename = useCallback(
    (id: string, title: string) => updateMeta(id, { title }),
    [updateMeta]
  )

  const setDescription = useCallback(
    (id: string, description: string) => updateMeta(id, { description }),
    [updateMeta]
  )

  const setCover = useCallback(
    (id: string, coverPath: string) => updateMeta(id, { coverPath }),
    [updateMeta]
  )

  const toggleFavorite = useCallback(
    (id: string) =>
      updateMeta(id, { favorite: !(metaMap.get(id)?.favorite ?? false) }),
    [metaMap, updateMeta]
  )

  const toggleHidden = useCallback(
    (id: string) =>
      updateMeta(id, { hidden: !(metaMap.get(id)?.hidden ?? false) }),
    [metaMap, updateMeta]
  )

  const value = useMemo(
    () => ({
      root,
      albums,
      allPhotos,
      sortKey,
      setSortKey,
      loading,
      error,
      openLibrary,
      getAlbum,
      rename,
      setDescription,
      setCover,
      toggleFavorite,
      toggleHidden,
    }),
    [
      root,
      albums,
      allPhotos,
      sortKey,
      loading,
      error,
      openLibrary,
      getAlbum,
      rename,
      setDescription,
      setCover,
      toggleFavorite,
      toggleHidden,
    ]
  )

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  )
}
