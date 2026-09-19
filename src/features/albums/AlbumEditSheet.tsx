import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { EffectiveAlbum } from "./types"

interface AlbumEditSheetProps {
  album: EffectiveAlbum | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (title: string, description: string) => Promise<void> | void
}

export function AlbumEditSheet({
  album,
  open,
  onOpenChange,
  onSave,
}: AlbumEditSheetProps) {
  const [title, setTitle] = useState(album?.title ?? "")
  const [description, setDescription] = useState(album?.description ?? "")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSave(title.trim(), description.trim())
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>编辑相册</SheetTitle>
          <SheetDescription>修改相册的标题与简介</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="album-title">标题</Label>
            <Input
              id="album-title"
              value={title}
              placeholder={album?.name ?? "相册标题"}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="album-description">简介</Label>
            <textarea
              id="album-description"
              value={description}
              rows={4}
              placeholder="添加一段描述..."
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            保存
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
