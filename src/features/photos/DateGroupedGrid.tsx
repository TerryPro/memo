import { useMemo } from "react"
import { MasonryGrid } from "./MasonryGrid"
import type { PhotoGroup } from "./group"

interface DateGroupedGridProps {
  groups: PhotoGroup[]
  onOpen: (index: number) => void
}

export function DateGroupedGrid({ groups, onOpen }: DateGroupedGridProps) {
  const startIndexes = useMemo(() => {
    const result: number[] = []
    let accumulator = 0
    for (const group of groups) {
      result.push(accumulator)
      accumulator += group.photos.length
    }
    return result
  }, [groups])

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group, groupIndex) => (
        <section key={group.key}>
          <div className="sticky top-0 z-10 -mx-4 mb-2 flex items-baseline justify-between gap-2 border-b border-border/40 bg-background/85 px-4 py-2 backdrop-blur lg:-mx-6 lg:px-6">
            <h3 className="text-sm font-semibold">{group.label}</h3>
            <span className="text-xs tabular-nums text-muted-foreground">
              {group.photos.length} 张
            </span>
          </div>
          <MasonryGrid
            photos={group.photos}
            startIndex={startIndexes[groupIndex]}
            onOpen={onOpen}
          />
        </section>
      ))}
    </div>
  )
}
