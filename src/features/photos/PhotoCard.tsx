import { convertFileSrc } from "@tauri-apps/api/core"
import { cn } from "cn"
import type { PhotoMeta } from "./types"

interface PhotoCardProps {
  photo: PhotoMeta
  index: number
  onOpen: (index: number) => void
}

export function PhotoCard({ photo, index, onOpen }: PhotoCardProps) {
  const aspectRatio =
    photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="group relative block w-full cursor-zoom-in overflow-hidden rounded-md bg-muted ring-1 ring-black/5 transition-shadow duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ aspectRatio }}
      aria-label={photo.name}
    >
      <img
        src={convertFileSrc(photo.path)}
        alt={photo.name}
        loading="lazy"
        decoding="async"
        className={cn(
          "size-full object-cover transition-[transform,opacity] duration-300",
          "opacity-0 group-hover:scale-[1.03] group-hover:opacity-100",
          "data-[loaded=true]:opacity-100"
        )}
        onLoad={(event) => {
          event.currentTarget.dataset.loaded = "true"
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pt-4 pb-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="block truncate text-left text-[11px] font-medium text-white/90">
          {photo.name}
        </span>
      </div>
    </button>
  )
}
