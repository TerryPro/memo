import type { ReactNode } from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme, type Palette, type Theme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const THEME_OPTIONS: { value: Theme; label: string; icon: ReactNode }[] = [
  { value: "light", label: "浅色", icon: <SunIcon /> },
  { value: "dark", label: "深色", icon: <MoonIcon /> },
  { value: "system", label: "跟随系统", icon: <MonitorIcon /> },
]

const PALETTE_OPTIONS: { value: Palette; label: string; swatch: string }[] = [
  { value: "emerald", label: "Emerald", swatch: "oklch(0.6988 0.2141 142.7064)" },
  { value: "tangerine", label: "Tangerine", swatch: "oklch(0.6802 0.1902 32.0008)" },
  { value: "neutral", label: "经典中性", swatch: "oklch(0.205 0 0)" },
]

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme, palette, setPalette } = useTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>个性化你的 memo 使用体验</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">主题</span>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={theme === option.value ? "default" : "outline"}
                aria-pressed={theme === option.value}
                className="h-auto flex-col gap-1.5 py-3"
                onClick={() => setTheme(option.value)}
              >
                {option.icon}
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            选择「跟随系统」时会根据操作系统的深浅色自动切换；在非输入状态下按 D
            键也可快速切换。
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">配色方案</span>
          <div className="grid grid-cols-3 gap-2">
            {PALETTE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={palette === option.value ? "default" : "outline"}
                aria-pressed={palette === option.value}
                className="h-auto justify-start gap-2 py-2.5"
                onClick={() => setPalette(option.value)}
              >
                <span
                  className="size-4 shrink-0 rounded-full border"
                  style={{ backgroundColor: option.swatch }}
                />
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
