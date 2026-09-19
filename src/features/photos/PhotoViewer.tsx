import { useCallback, useEffect, useState } from "react"
import { convertFileSrc } from "@tauri-apps/api/core"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  InfoIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { InfoPanel } from "./InfoPanel"
import type { PhotoMeta } from "./types"

const MIN_SCALE = 1
const MAX_SCALE = 5
const SCALE_STEP = 0.5

interface PhotoViewerProps {
  photos: PhotoMeta[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onSetCover?: (path: string) => void
}

export function PhotoViewer({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
  onSetCover,
}: PhotoViewerProps) {
  const [scale, setScale] = useState(1)
  const [showInfo, setShowInfo] = useState(false)
  const [lastIndex, setLastIndex] = useState(index)

  // Reset zoom during render when the active photo changes.
  if (index !== lastIndex) {
    setLastIndex(index)
    setScale(1)
  }

  const photo = photos[index]

  const zoomIn = useCallback(() => {
    setScale((value) => Math.min(MAX_SCALE, value + SCALE_STEP))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((value) => Math.max(MIN_SCALE, value - SCALE_STEP))
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          onPrev()
          break
        case "ArrowRight":
          onNext()
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, onPrev, onNext])

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.deltaY < 0) {
      setScale((value) => Math.min(MAX_SCALE, value + SCALE_STEP))
    } else {
      setScale((value) => Math.max(MIN_SCALE, value - SCALE_STEP))
    }
  }, [])

  if (!photo) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-black/90">
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onWheel={handleWheel}
      >
        <img
          src={convertFileSrc(photo.path)}
          alt={photo.name}
          className="max-h-full max-w-full object-contain transition-transform duration-150 select-none"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-3 backdrop-blur-[2px]">
          <span className="truncate text-sm font-medium text-white/90">
            {photo.name}
            <span className="ml-2 text-xs tabular-nums text-white/60">
              {index + 1} / {photos.length}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <span className="mr-1 min-w-12 text-center text-xs tabular-nums text-white/70">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={zoomOut}
              aria-label="缩小"
            >
              <ZoomOutIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={zoomIn}
              aria-label="放大"
            >
              <ZoomInIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setShowInfo((value) => !value)}
              aria-label="信息"
              aria-pressed={showInfo}
            >
              <InfoIcon />
            </Button>
            {onSetCover && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => onSetCover(photo.path)}
                aria-label="设为封面"
              >
                <ImageIcon />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={onClose}
              aria-label="关闭"
            >
              <XIcon />
            </Button>
          </div>
        </div>

        {/* Prev / Next */}
        <Button
          variant="ghost"
          size="icon-lg"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
          onClick={onPrev}
          aria-label="上一张"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
          onClick={onNext}
          aria-label="下一张"
        >
          <ChevronRightIcon />
        </Button>

        {/* Keyboard hints */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/60 to-transparent p-3">
          <span className="text-xs text-white/60">
            ← → 切换 · Esc 关闭 · 滚轮缩放
          </span>
        </div>
      </div>

      {showInfo && (
        <aside className="w-80 shrink-0 border-l border-border/60">
          <InfoPanel key={photo.path} photo={photo} />
        </aside>
      )}
    </div>
  )
}
