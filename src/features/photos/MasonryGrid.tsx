import { useEffect, useMemo, useRef, useState } from "react"
import { PhotoCard } from "./PhotoCard"
import type { PhotoMeta } from "./types"

const COLUMN_WIDTH = 280
const GAP = 8
const MIN_COLUMNS = 2
const MAX_COLUMNS = 8

interface MasonryGridProps {
  photos: PhotoMeta[]
  startIndex?: number
  onOpen: (index: number) => void
}

export function MasonryGrid({
  photos,
  startIndex = 0,
  onOpen,
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(element)
    setContainerWidth(element.getBoundingClientRect().width)

    return () => observer.disconnect()
  }, [])

  const columnCount = useMemo(() => {
    if (containerWidth <= 0) return MIN_COLUMNS
    const raw = Math.floor((containerWidth + GAP) / (COLUMN_WIDTH + GAP))
    return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, raw))
  }, [containerWidth])

  const columns = useMemo(() => {
    const buckets: { photo: PhotoMeta; index: number }[][] = Array.from(
      { length: columnCount },
      () => []
    )
    const heights = new Array<number>(columnCount).fill(0)

    photos.forEach((photo, index) => {
      const ratio =
        photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1
      const estimatedHeight = COLUMN_WIDTH / ratio

      let target = 0
      for (let column = 1; column < columnCount; column++) {
        if (heights[column] < heights[target]) target = column
      }

      buckets[target].push({ photo, index: startIndex + index })
      heights[target] += estimatedHeight + GAP
    })

    return buckets
  }, [photos, columnCount, startIndex])

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex items-start" style={{ gap: GAP }}>
        {columns.map((bucket, columnIndex) => (
          <div
            key={columnIndex}
            className="flex min-w-0 flex-1 flex-col"
            style={{ gap: GAP }}
          >
            {bucket.map(({ photo, index }) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                onOpen={onOpen}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
