import { useState } from "react"
import { NavLink } from "react-router-dom"
import { convertFileSrc } from "@tauri-apps/api/core"
import {
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  FolderIcon,
  FolderPlusIcon,
  ImagesIcon,
  MoreHorizontalIcon,
  PanelRightCloseIcon,
  PencilIcon,
  RefreshCwIcon,
  StarIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { cn } from "cn"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { AlbumEditSheet } from "@/features/albums/AlbumEditSheet"
import { useLibrary } from "@/features/albums/LibraryContext"
import { folderName } from "@/features/albums/paths"
import type {
  EffectiveAlbum,
  EffectiveAlbumNode,
  LibraryRootTree,
} from "@/features/albums/types"

/** 每层目录的缩进宽度（px）。 */
const INDENT_STEP = 12

const ROW_BASE =
  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-sidebar-foreground transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"

function rowClass(isActive: boolean) {
  return cn(
    ROW_BASE,
    isActive
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "hover:bg-sidebar-accent/60"
  )
}

interface AlbumsPanelProps {
  onCollapse: () => void
}

export function AlbumsPanel({ onCollapse }: AlbumsPanelProps) {
  const {
    roots,
    tree,
    albums,
    allPhotos,
    loading,
    addRoots,
    removeRoot,
    reload,
    rename,
    setDescription,
    toggleFavorite,
    toggleHidden,
  } = useLibrary()

  const [showHidden, setShowHidden] = useState(false)
  const [editing, setEditing] = useState<EffectiveAlbum | null>(null)
  /** 用户手动切换过展开状态的目录 id。 */
  const [toggledNodes, setToggledNodes] = useState<string[]>([])
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)

  const toggleNode = (id: string) =>
    setToggledNodes((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )

  const handleSave = async (title: string, description: string) => {
    if (!editing) return
    await rename(editing.id, title)
    await setDescription(editing.id, description)
    setEditing(null)
  }

  const confirmRemove = async () => {
    const root = pendingRemove
    setPendingRemove(null)
    if (root) await removeRoot(root)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l bg-sidebar/40">
      <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
        <span className="flex-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          相册
        </span>
        {roots.length > 0 && !loading && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
            {albums.length}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={() => void reload()}
          disabled={roots.length === 0 || loading}
          aria-label="重新扫描全部目录"
        >
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={() => setShowHidden((value) => !value)}
          aria-label={showHidden ? "隐藏已隐藏相册" : "显示已隐藏相册"}
        >
          {showHidden ? <EyeIcon /> : <EyeOffIcon />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={onCollapse}
          aria-label="折叠相册栏"
        >
          <PanelRightCloseIcon />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="mb-2 rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-sm font-medium">
            {roots.length > 0 ? `${roots.length} 个图库目录` : "未添加图库目录"}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
            {roots.length > 0
              ? `${allPhotos.length} 张 · ${albums.length} 个相册`
              : "可添加多个目录，照片会一起展示"}
          </p>
        </div>

        <ul className="flex flex-col gap-0.5">
          <li>
            <NavLink
              to="/photos"
              end
              className={({ isActive }) => rowClass(isActive)}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted ring-1 ring-border/50">
                <ImagesIcon className="size-4 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  全部照片
                </span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {allPhotos.length}
              </span>
            </NavLink>
          </li>
        </ul>

        <div className="my-2 h-px bg-border" />

        {loading ? (
          <ul className="flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="flex items-center gap-2.5 px-2 py-1.5">
                <Skeleton className="size-8 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : roots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
            <p className="text-xs text-muted-foreground">
              还没有添加任何图片目录
            </p>
            <Button variant="outline" size="sm" onClick={() => void addRoots()}>
              <FolderPlusIcon />
              <span>添加目录</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {tree.map((entry) => (
              <RootSection
                key={entry.root}
                entry={entry}
                showHidden={showHidden}
                toggledNodes={toggledNodes}
                onToggleNode={toggleNode}
                onRemoveRoot={setPendingRemove}
                onEdit={setEditing}
                onToggleFavorite={toggleFavorite}
                onToggleHidden={toggleHidden}
              />
            ))}
          </div>
        )}
      </div>

      <AlbumEditSheet
        key={editing?.id ?? "none"}
        album={editing}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        onSave={handleSave}
      />

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>移出图库？</AlertDialogTitle>
            <AlertDialogDescription>
              将从图库中移除「
              {pendingRemove ? folderName(pendingRemove) : ""}
              」，磁盘上的照片不会被删除。相册的标题、封面等设置会保留，重新添加该目录即可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void confirmRemove()}
            >
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}

interface RootSectionProps {
  entry: LibraryRootTree
  showHidden: boolean
  toggledNodes: string[]
  onToggleNode: (id: string) => void
  onRemoveRoot: (root: string) => void
  onEdit: (album: EffectiveAlbum) => void
  onToggleFavorite: (id: string) => Promise<void>
  onToggleHidden: (id: string) => Promise<void>
}

function RootSection({
  entry,
  showHidden,
  toggledNodes,
  onToggleNode,
  onRemoveRoot,
  onEdit,
  onToggleFavorite,
  onToggleHidden,
}: RootSectionProps) {
  if (!entry.album) {
    return (
      <div className="rounded-md px-1.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <TriangleAlertIcon className="size-3.5 shrink-0 text-destructive" />
          <span
            className="min-w-0 flex-1 truncate text-sm font-medium text-destructive"
            title={entry.root}
          >
            {folderName(entry.root)}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemoveRoot(entry.root)}
            aria-label={`移除目录 ${folderName(entry.root)}`}
          >
            <XIcon />
          </Button>
        </div>
        <p className="mt-0.5 pl-5 text-xs text-destructive">
          目录不可用{entry.error ? `:${entry.error}` : ""}
        </p>
      </div>
    )
  }

  return (
    <AlbumTreeRow
      album={entry.album}
      depth={0}
      isRoot
      showHidden={showHidden}
      toggledNodes={toggledNodes}
      onToggleNode={onToggleNode}
      onRemoveRoot={onRemoveRoot}
      onEdit={onEdit}
      onToggleFavorite={onToggleFavorite}
      onToggleHidden={onToggleHidden}
    />
  )
}

interface AlbumTreeRowProps extends Omit<RootSectionProps, "entry"> {
  album: EffectiveAlbumNode
  depth: number
  isRoot: boolean
}

function AlbumTreeRow({
  album,
  depth,
  isRoot,
  showHidden,
  toggledNodes,
  onToggleNode,
  onRemoveRoot,
  onEdit,
  onToggleFavorite,
  onToggleHidden,
}: AlbumTreeRowProps) {
  if (!showHidden && album.hidden) return null

  const children = album.children
  const hasChildren = children.length > 0
  // 根目录默认展开（即默认能看到第一层子目录），其余层级默认折叠。
  const defaultOpen = depth === 0
  const open = toggledNodes.includes(album.id) ? !defaultOpen : defaultOpen

  const clickable = album.photos.length > 0
  const subtitle =
    clickable
      ? `${album.photos.length} 张`
      : hasChildren
        ? `${children.length} 个子目录`
        : "没有找到图片"

  const icon = (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted ring-1 ring-border/50">
      {clickable && album.cover ? (
        <img
          src={convertFileSrc(album.cover.path)}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <FolderIcon className="size-4 text-muted-foreground" />
      )}
    </span>
  )

  const label = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{album.title}</span>
        <span className="block text-xs tabular-nums text-muted-foreground">
          {subtitle}
          {album.hidden ? " · 已隐藏" : ""}
        </span>
      </span>
    </>
  )

  return (
    <div>
      <div
        className="group/row flex items-center gap-0.5 rounded-md pr-1"
        style={{ paddingLeft: depth * INDENT_STEP }}
      >
        <button
          type="button"
          onClick={() => onToggleNode(album.id)}
          disabled={!hasChildren}
          aria-label={open ? `折叠 ${album.title}` : `展开 ${album.title}`}
          aria-expanded={hasChildren ? open : undefined}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors",
            hasChildren
              ? "hover:bg-sidebar-accent hover:text-foreground"
              : "invisible"
          )}
        >
          <ChevronDownIcon
            className={cn(
              "size-3.5 transition-transform",
              !open && "-rotate-90"
            )}
          />
        </button>

        {clickable ? (
          <NavLink
            to={`/photos/albums/${encodeURIComponent(album.id)}`}
            title={album.path}
            className={({ isActive }) => rowClass(isActive)}
          >
            {label}
          </NavLink>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5">
            {label}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
          {clickable && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                className={cn(!album.favorite && "opacity-60")}
                onClick={() => void onToggleFavorite(album.id)}
                aria-label={album.favorite ? "取消收藏" : "收藏"}
              >
                <StarIcon
                  className={cn(
                    album.favorite && "fill-yellow-400 text-yellow-400"
                  )}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="更多操作"
                    />
                  }
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(album)}>
                    <PencilIcon />
                    <span>编辑</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => void onToggleHidden(album.id)}
                  >
                    {album.hidden ? <EyeIcon /> : <EyeOffIcon />}
                    <span>{album.hidden ? "显示相册" : "隐藏相册"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          {isRoot && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemoveRoot(album.root)}
              aria-label={`移除目录 ${folderName(album.root)}`}
            >
              <XIcon />
            </Button>
          )}
        </div>
      </div>

      {open &&
        children.map((child) => (
          <AlbumTreeRow
            key={child.id}
            album={child}
            depth={depth + 1}
            isRoot={false}
            showHidden={showHidden}
            toggledNodes={toggledNodes}
            onToggleNode={onToggleNode}
            onRemoveRoot={onRemoveRoot}
            onEdit={onEdit}
            onToggleFavorite={onToggleFavorite}
            onToggleHidden={onToggleHidden}
          />
        ))}
    </div>
  )
}
