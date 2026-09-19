import { useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useRepos } from "./ReposContext"
import { formatResetTime } from "./repoMeta"

interface RepoSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RepoSettingsSheet({
  open,
  onOpenChange,
}: RepoSettingsSheetProps) {
  const { settings, saveSettings, rateLimit } = useRepos()
  const [token, setToken] = useState(settings.githubToken ?? "")
  const [autoSync, setAutoSync] = useState(settings.autoSyncOnOpen)
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSettings({
        githubToken: token.trim() ? token.trim() : null,
        autoSyncOnOpen: autoSync,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>GitHub 设置</SheetTitle>
          <SheetDescription>配置访问令牌与自动刷新策略</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="github-token">Personal Access Token</Label>
            <div className="flex gap-2">
              <Input
                id="github-token"
                type={showToken ? "text" : "password"}
                value={token}
                placeholder="ghp_..."
                autoComplete="off"
                onChange={(event) => setToken(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowToken((value) => !value)}
                aria-label={showToken ? "隐藏令牌" : "显示令牌"}
              >
                {showToken ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              用于提高 GitHub API 速率限制（未认证 60 次/时，认证 5000
              次/时）。令牌仅保存在本地 settings.json，不会上传。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={(checked) => setAutoSync(checked === true)}
            />
            <Label htmlFor="auto-sync">打开页面时自动刷新</Label>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            {rateLimit
              ? `GitHub API 剩余额度：${rateLimit.remaining}/${rateLimit.limit}（已用 ${rateLimit.used}），重置于 ${formatResetTime(rateLimit.reset)}`
              : "GitHub API 剩余额度：未知（点击工具栏仪表图标查询）"}
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            保存
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
