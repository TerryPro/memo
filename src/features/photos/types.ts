export interface PhotoMeta {
  id: string
  path: string
  name: string
  width: number
  height: number
  size: number
  modified: number | null
}

export interface ExifData {
  make?: string
  model?: string
  software?: string
  artist?: string
  copyright?: string
  lensMake?: string
  lensModel?: string
  dateTimeOriginal?: string
  exposureTime?: string
  shutterSpeed?: string
  fNumber?: string
  aperture?: string
  iso?: string
  exposureProgram?: string
  exposureBias?: string
  focalLength?: string
  focalLength35mm?: string
  flash?: string
  lightSource?: string
  meteringMode?: string
  whiteBalance?: string
  colorSpace?: string
  orientation?: string
  brightness?: string
  pixelWidth?: string
  pixelHeight?: string
  gpsLatitude?: number
  gpsLongitude?: number
  gpsAltitude?: string
}

export type SortKey = "name" | "date" | "size"
