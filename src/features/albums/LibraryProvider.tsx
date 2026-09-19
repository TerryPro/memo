import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { open } from "@tauri-apps/plugin-dialog"
import { toast } from "sonner"
import {
  loadAlbumMeta,
  loadLibraryRoots,
  saveAlbumMeta,
  saveLibraryRoots,
  scanLibrary,
} from "@/lib/albums"
import { LibraryContext } from "./LibraryContext"
import { canonicalPath, isWithin, trimTrailingSeparators } from "./paths"
import type {
  AddRootsResult,
  AlbumMeta,
  AlbumNode,
  EffectiveAlbum,
  EffectiveAlbumNode,
  LibraryRootTree,
  RootScan,
} from "./types"
import type { SortKey } from "@/features/photos/types"

function toEffectiveAlbum(
  node: AlbumNode,
  root: string,
  metaMap: Map<string, AlbumMeta>
): EffectiveAlbumNode {
  const meta = metaMap.get(node.id)
  const coverFromMeta = meta?.coverPath
    ? node.photos.find((photo) => photo.path === meta.coverPath)
    : undefined

  return {
    id: node.id,
    root,
    name: node.name,
    path: node.path,
    photos: node.photos,
    title: meta?.title?.trim() ? meta.title : node.name,
    description: meta?.description ?? null,
    cover: coverFromMeta ?? node.photos[0] ?? null,
    favorite: meta?.favorite ?? false,
    hidden: meta?.hidden ?? false,
    totalPhotoCount: node.totalPhotoCount,
    children: node.children.map((child) =>
      toEffectiveAlbum(child, root, metaMap)
    ),
  }
}

/** 把目录树拍平成相册列表，便于按 id 查找与编辑。 */
function flattenAlbums(nodes: EffectiveAlbumNode[]): EffectiveAlbum[] {
  return nodes.flatMap((node) => [node, ...flattenAlbums(node.children)])
}

function describeAddResult(result: AddRootsResult) {
  const parts: string[] = []
  if (result.added > 0) parts.push(`已添加 ${result.added} 个目录`)
  if (result.skipped > 0) parts.push(`跳过 ${result.skipped} 个已在图库中的目录`)
  if (result.replaced > 0) parts.push(`合并 ${result.replaced} 个被包含的目录`)

  if (result.added === 0 && result.replaced === 0) {
    toast.info(parts.join("，"))
    return
  }
  toast.success(parts.join("，"))
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [roots, setRoots] = useState<string[]>([])
  const [scans, setScans] = useState<RootScan[]>([])
  const [metaMap, setMetaMap] = useState<Map<string, AlbumMeta>>(
    () => new Map()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("name")

  const tree = useMemo<LibraryRootTree[]>(
    () =>
      scans.map((scan) => ({
        root: scan.root,
        album: scan.node
          ? toEffectiveAlbum(scan.node, scan.root, metaMap)
          : null,
        error: scan.error ?? null,
      })),
    [scans, metaMap]
  )

  const albums = useMemo(
    () =>
      flattenAlbums(tree.flatMap((entry) => (entry.album ? [entry.album] : []))),
    [tree]
  )

  const allPhotos = useMemo(
    () => albums.flatMap((album) => album.photos),
    [albums]
  )

  const rescan = useCallback(async (list: string[]) => {
    if (list.length === 0) {
      setScans([])
      setError(null)
      return
    }

    setLoading(true)
    try {
      const [scan, metas] = await Promise.all([
        scanLibrary(list),
        loadAlbumMeta(),
      ])
      const map = new Map<string, AlbumMeta>()
      for (const meta of metas) map.set(meta.id, meta)

      setScans(scan.roots)
      setMetaMap(map)
      setError(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  /** 打开目录选择器，把选中的多个目录加入图库（自动去重与嵌套合并）。 */
  const addRoots = useCallback(async () => {
    setError(null)

    let selected: string | string[] | null
    try {
      selected = await open({ directory: true, multiple: true })
    } catch (err) {
      setError(String(err))
      return
    }

    const picked = typeof selected === "string" ? [selected] : (selected ?? [])
    if (picked.length === 0) return

    const list = [...roots]
    const result: AddRootsResult = {
      added: 0,
      skipped: 0,
      replaced: 0,
      cancelled: false,
    }

    for (const raw of picked) {
      const dir = trimTrailingSeparators(raw)
      if (!dir) continue
      const target = canonicalPath(dir)

      // 该目录已被现有目录覆盖，跳过以免照片重复出现。
      if (list.some((existing) => isWithin(target, canonicalPath(existing)))) {
        result.skipped += 1
        continue
      }

      // 新目录包含了已有目录时，用新目录替换它们。
      for (let index = list.length - 1; index >= 0; index -= 1) {
        if (isWithin(canonicalPath(list[index]), target)) {
          list.splice(index, 1)
          result.replaced += 1
        }
      }

      list.push(dir)
      result.added += 1
    }

    if (result.added === 0 && result.replaced === 0) {
      describeAddResult(result)
      return
    }

    setRoots(list)
    await saveLibraryRoots(list)
    await rescan(list)
    describeAddResult(result)
  }, [rescan, roots])

  const removeRoot = useCallback(
    async (root: string) => {
      const list = roots.filter((item) => item !== root)
      setRoots(list)
      setScans((current) => current.filter((scan) => scan.root !== root))
      setError(null)
      await saveLibraryRoots(list)
    },
    [roots]
  )

  const reload = useCallback(() => rescan(roots), [rescan, roots])

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

  useEffect(() => {
    let cancelled = false

    loadLibraryRoots()
      .then((saved) => {
        if (cancelled) return
        const list = saved ?? []
        setRoots(list)
        if (list.length > 0) return rescan(list)
      })
      .catch((err) => {
        if (cancelled) return
        setError(String(err))
      })

    return () => {
      cancelled = true
    }
  }, [rescan])

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
      roots,
      tree,
      albums,
      allPhotos,
      sortKey,
      setSortKey,
      loading,
      error,
      addRoots,
      removeRoot,
      reload,
      getAlbum,
      rename,
      setDescription,
      setCover,
      toggleFavorite,
      toggleHidden,
    }),
    [
      roots,
      tree,
      albums,
      allPhotos,
      sortKey,
      loading,
      error,
      addRoots,
      removeRoot,
      reload,
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
