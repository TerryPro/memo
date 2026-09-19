/** 去掉路径末尾的分隔符（Windows 盘符根目录会保留，如 "C:\\"）。 */
export function trimTrailingSeparators(path: string) {
  const stripped = path.replace(/[\\/]+$/, "")
  if (stripped.length === 0) return path
  // "C:" 表示当前盘的工作目录，需要保留盘符后的分隔符。
  if (/^[a-zA-Z]:$/.test(stripped)) return `${stripped}\\`
  return stripped
}

/** 统一分隔符与大小写，方便比较。 */
export function canonicalPath(path: string) {
  const stripped = path.replace(/[\\/]+$/, "")
  return (stripped.length > 0 ? stripped : path)
    .replace(/\\/g, "/")
    .toLowerCase()
}

/** child 是否位于 parent 之内（含相等）。 */
export function isWithin(child: string, parent: string) {
  return child === parent || child.startsWith(`${parent}/`)
}

/** 取路径最后一段作为展示名。 */
export function folderName(path: string) {
  const segments = trimTrailingSeparators(path).split(/[\\/]/).filter(Boolean)
  return segments[segments.length - 1] ?? path
}
