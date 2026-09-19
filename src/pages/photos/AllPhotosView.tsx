import { useMemo, useState } from "react"
import { ImageIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useLibrary } from "@/features/albums/LibraryContext"
import { DateGroupedGrid } from "@/features/photos/DateGroupedGrid"
import { groupPhotosByDate } from "@/features/photos/group"
import { PhotoViewer } from "@/features/photos/PhotoViewer"

function LoadingGrid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2">
      {Array.from({ length: 12 }).map((_, index) => (
        <Skeleton
          key={index}
          className="w-full rounded-md"
          style={{ aspectRatio: index % 3 === 0 ? "3 / 4" : "4 / 3" }}
        />
      ))}
    </div>
  )
}

export function AllPhotosView() {
  const { allPhotos, sortKey, roots, loading } = useLibrary()
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const groups = useMemo(
    () => groupPhotosByDate(allPhotos, sortKey),
    [allPhotos, sortKey]
  )

  const flat = useMemo(
    () => groups.flatMap((group) => group.photos),
    [groups]
  )

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

  return (
    <div className="px-4 py-3 lg:px-6">
      {loading ? (
        <LoadingGrid />
      ) : flat.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-lg font-semibold">全部照片</h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {flat.length} 张
            </span>
          </div>
          <DateGroupedGrid groups={groups} onOpen={setViewerIndex} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {roots.length > 0 ? "图库中暂无照片" : "开始浏览你的照片"}
            </p>
            <p className="text-xs text-muted-foreground">
              {roots.length > 0
                ? "已添加的目录下没有找到受支持的图片"
                : "添加一个或多个图片目录，照片将按日期自动分组"}
            </p>
          </div>

        </div>
      )}

      {viewerIndex !== null && (
        <PhotoViewer
          photos={flat}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </div>
  )
}
