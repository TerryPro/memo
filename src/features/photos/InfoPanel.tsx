import { useEffect, useState } from "react"
import { readExif } from "@/lib/photos"
import { Skeleton } from "@/components/ui/skeleton"
import type { ExifData, PhotoMeta } from "./types"

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-right text-xs font-medium">{value}</span>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border/60 px-4 py-3 last:border-b-0">
      <h3 className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

export function InfoPanel({ photo }: { photo: PhotoMeta }) {
  const [exif, setExif] = useState<ExifData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    readExif(photo.path)
      .then((data) => {
        if (active) setExif(data)
      })
      .catch((err) => {
        if (active) setError(String(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [photo.path])

  const hasGps =
    exif?.gpsLatitude !== undefined && exif?.gpsLongitude !== undefined

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background/95 backdrop-blur">
      <div className="px-4 py-3">
        <p className="truncate text-sm font-semibold" title={photo.name}>
          {photo.name}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 px-4 pb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : error ? (
        <div className="px-4 pb-4 text-xs text-muted-foreground">
          无法读取 EXIF 信息
        </div>
      ) : (
        <>
          <Section title="文件">
            <Row label="尺寸" value={`${photo.width} × ${photo.height}`} />
            <Row label="大小" value={formatSize(photo.size)} />
            <Row
              label="修改时间"
              value={
                photo.modified
                  ? new Date(photo.modified).toLocaleString()
                  : undefined
              }
            />
            <Row label="路径" value={photo.path} />
          </Section>

          <Section title="相机">
            <Row label="厂商" value={exif?.make} />
            <Row label="型号" value={exif?.model} />
            <Row label="镜头" value={exif?.lensModel ?? exif?.lensMake} />
            <Row label="软件" value={exif?.software} />
          </Section>

          <Section title="曝光">
            <Row label="快门" value={exif?.exposureTime ?? exif?.shutterSpeed} />
            <Row label="光圈" value={exif?.fNumber ?? exif?.aperture} />
            <Row label="ISO" value={exif?.iso} />
            <Row label="焦距" value={exif?.focalLength} />
            <Row label="等效焦距" value={exif?.focalLength35mm} />
            <Row label="闪光灯" value={exif?.flash} />
            <Row label="测光" value={exif?.meteringMode} />
            <Row label="白平衡" value={exif?.whiteBalance} />
          </Section>

          <Section title="时间">
            <Row label="拍摄时间" value={exif?.dateTimeOriginal} />
          </Section>

          {hasGps && (
            <Section title="位置">
              <Row label="纬度" value={exif?.gpsLatitude?.toFixed(6)} />
              <Row label="经度" value={exif?.gpsLongitude?.toFixed(6)} />
              <Row label="海拔" value={exif?.gpsAltitude} />
            </Section>
          )}
        </>
      )}
    </div>
  )
}
