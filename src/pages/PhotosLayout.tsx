import { useState } from "react"
import { Outlet } from "react-router-dom"
import { FolderOpenIcon, PanelRightOpenIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLibrary } from "@/features/albums/LibraryContext"
import { AlbumsPanel } from "@/features/albums/AlbumsPanel"
import type { SortKey } from "@/features/photos/types"

const SORT_ITEMS: { label: string; value: SortKey }[] = [
  { label: "组内:名称", value: "name" },
  { label: "组内:时间", value: "date" },
  { label: "组内:大小", value: "size" },
]

export function PhotosLayout() {
  const { root, albums, allPhotos, loading, error, openLibrary, sortKey, setSortKey } =
    useLibrary()
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  return (
    <div className="flex h-[calc(100dvh_-_var(--header-height))] flex-col overflow-hidden md:h-[calc(100dvh_-_var(--header-height)_-_1rem)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:px-6">
        <Button variant="outline" onClick={openLibrary} disabled={loading}>
          <FolderOpenIcon />
          <span>{root ? "更换图库" : "打开图库文件夹"}</span>
        </Button>

        {root && (
          <span
            className="max-w-64 truncate text-xs text-muted-foreground"
            title={root}
          >
            {root}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {root && !loading && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {allPhotos.length} 张 · {albums.length} 个相册
            </span>
          )}
          <Select
            value={sortKey}
            onValueChange={(value) => setSortKey(value as SortKey)}
            items={SORT_ITEMS}
          >
            <SelectTrigger size="sm" aria-label="组内排序方式">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SORT_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {panelCollapsed && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPanelCollapsed(false)}
              aria-label="展开相册栏"
            >
              <PanelRightOpenIcon />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-4 pb-2 lg:px-6">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>

        {!panelCollapsed && (
          <AlbumsPanel onCollapse={() => setPanelCollapsed(true)} />
        )}
      </div>
    </div>
  )
}
