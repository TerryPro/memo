import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeftIcon, ImageIcon, PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlbumEditSheet } from "@/features/albums/AlbumEditSheet"
import { useLibrary } from "@/features/albums/LibraryContext"
import { DateGroupedGrid } from "@/features/photos/DateGroupedGrid"
import { groupPhotosByDate } from "@/features/photos/group"
import { PhotoViewer } from "@/features/photos/PhotoViewer"

export function AlbumDetailView() {
  const { albumId } = useParams<{ albumId: string }>()
  const decodedId = albumId ? decodeURIComponent(albumId) : ""
  const { albums, sortKey, rename, setDescription, setCover } = useLibrary()
  const album = albums.find((item) => item.id === decodedId)

  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)

  const groups = useMemo(
    () => (album ? groupPhotosByDate(album.photos, sortKey) : []),
    [album, sortKey]
  )

  const flat = useMemo(
    () => groups.flatMap((group) => group.photos),
    [groups]
  )

  if (!album) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ImageIcon className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">相册不存在或已被移动</p>
          <p className="text-xs text-muted-foreground">
            它可能已从图库中移除
          </p>
        </div>
        <Button variant="outline" render={<Link to="/photos" />}>
          <ArrowLeftIcon />
          <span>返回全部照片</span>
        </Button>
      </div>
    )
  }

  const showPrev = () =>
    setViewerIndex((current) =>
      current === null ? current : current <= 0 ? flat.length - 1 : current - 1
    )

  const showNext = () =>
    setViewerIndex((current) =>
      current === null
        ? current
        : current >= flat.length - 1
          ? 0
          : current + 1
    )

  const handleSave = async (title: string, description: string) => {
    await rename(album.id, title)
    await setDescription(album.id, description)
    setEditing(false)
  }

  const handleSetCover = async (path: string) => {
    await setCover(album.id, path)
    toast.success("已设为相册封面")
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-3 lg:px-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{album.title}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{flat.length} 张</span>
            {album.description && <span>· {album.description}</span>}
          </div>
        </div>

        <Button variant="outline" onClick={() => setEditing(true)}>
          <PencilIcon />
          <span>编辑</span>
        </Button>
      </div>

      {flat.length > 0 ? (
        <DateGroupedGrid groups={groups} onOpen={setViewerIndex} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="size-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">该相册暂无照片</p>
        </div>
      )}

      {viewerIndex !== null && (
        <PhotoViewer
          photos={flat}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onPrev={showPrev}
          onNext={showNext}
          onSetCover={handleSetCover}
        />
      )}

      <AlbumEditSheet
        key={String(editing)}
        album={album}
        open={editing}
        onOpenChange={setEditing}
        onSave={handleSave}
      />
    </div>
  )
}
