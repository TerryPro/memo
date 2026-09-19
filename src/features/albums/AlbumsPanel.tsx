import { useMemo, useState } from "react"
import { NavLink } from "react-router-dom"
import { convertFileSrc } from "@tauri-apps/api/core"
import {
  EyeIcon,
  EyeOffIcon,
  FolderIcon,
  ImagesIcon,
  MoreHorizontalIcon,
  PanelRightCloseIcon,
  PencilIcon,
  StarIcon,
} from "lucide-react"
import { cn } from "cn"
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
import type { EffectiveAlbum } from "@/features/albums/types"

const ROW_BASE =
  "flex items-center gap-2.5 rounded-md py-1.5 pr-14 pl-2 text-sidebar-foreground transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"

function rowClass(isActive: boolean) {
  return cn(
    ROW_BASE,
    isActive
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "hover:bg-sidebar-accent/60"
  )
}

function folderName(root: string) {
  const segments = root.split(/[\\/]/).filter(Boolean)
  return segments[segments.length - 1] ?? root
}

interface AlbumsPanelProps {
  onCollapse: () => void
}

export function AlbumsPanel({ onCollapse }: AlbumsPanelProps) {
  const {
    root,
    albums,
    allPhotos,
    loading,
    rename,
    setDescription,
    toggleFavorite,
    toggleHidden,
  } = useLibrary()

  const [showHidden, setShowHidden] = useState(false)
  const [editing, setEditing] = useState<EffectiveAlbum | null>(null)

  const visibleAlbums = useMemo(
    () => albums.filter((album) => showHidden || !album.hidden),
    [albums, showHidden]
  )

  const handleSave = async (title: string, description: string) => {
    if (!editing) return
    await rename(editing.id, title)
    await setDescription(editing.id, description)
    setEditing(null)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l bg-sidebar/40">
      <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
        <span className="flex-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          相册
        </span>
        {root && !loading && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
            {albums.length}
          </span>
        )}
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
          <p className="truncate text-sm font-medium" title={root ?? undefined}>
            {root ? folderName(root) : "未打开图库"}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
            {root
              ? `${allPhotos.length} 张 · ${albums.length} 个相册`
              : "在上方打开一个图库文件夹"}
          </p>
        </div>

        <ul className="flex flex-col gap-0.5">
          <li>
            <NavLink
              to="/photos"
              end
              className={({ isActive }) => rowClass(isActive)}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted ring-1 ring-border/50">
                <ImagesIcon className="size-4.5 text-muted-foreground" />
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
                <Skeleton className="size-9 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : visibleAlbums.length > 0 ? (
          <ul className="flex flex-col gap-0.5">
            {visibleAlbums.map((album) => (
              <li key={album.id} className="group relative">
                <NavLink
                  to={`/photos/albums/${encodeURIComponent(album.id)}`}
                  className={({ isActive }) => rowClass(isActive)}
                >
                  <span className="size-9 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/50">
                    {album.cover ? (
                      <img
                        src={convertFileSrc(album.cover.path)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center">
                        <FolderIcon className="size-4.5 text-muted-foreground" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {album.title}
                    </span>
                    <span className="block text-xs tabular-nums text-muted-foreground">
                      {album.photos.length} 张
                      {album.hidden ? " · 已隐藏" : ""}
                    </span>
                  </span>
                </NavLink>

                <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className={cn(
                      "transition-opacity",
                      !album.favorite && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    )}
                    onClick={() => toggleFavorite(album.id)}
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
                          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-open:opacity-100"
                          aria-label="更多操作"
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(album)}>
                        <PencilIcon />
                        <span>编辑</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleHidden(album.id)}>
                        {album.hidden ? <EyeIcon /> : <EyeOffIcon />}
                        <span>{album.hidden ? "显示相册" : "隐藏相册"}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {root ? "暂无子相册" : "打开图库后显示相册"}
          </p>
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
    </aside>
  )
}
