import { useState } from "react"
import {
  GaugeIcon,
  Loader2Icon,
  PanelRightOpenIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  WandSparklesIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRepos } from "./ReposContext"
import { SORT_ITEMS, formatResetTime } from "./repoMeta"
import type { RepoSortKey } from "./types"

interface RepoToolbarProps {
  onCreate: () => void
  onOpenSettings: () => void
  panelCollapsed: boolean
  onExpandPanel: () => void
}

export function RepoToolbar({
  onCreate,
  onOpenSettings,
  panelCollapsed,
  onExpandPanel,
}: RepoToolbarProps) {
  const {
    repos,
    starredCount,
    search,
    setSearch,
    sortKey,
    setSortKey,
    refreshAll,
    addRepoFromUrl,
    rateLimit,
    refreshRateLimit,
    refreshingIds,
  } = useRepos()

  const [quickUrl, setQuickUrl] = useState("")
  const [quickAdding, setQuickAdding] = useState(false)

  const refreshing = refreshingIds.length > 0
  const rateLimitLow = rateLimit !== null && rateLimit.remaining <= 10
  const rateLimitTitle = rateLimit
    ? `GitHub API 剩余 ${rateLimit.remaining}/${rateLimit.limit}（已用 ${rateLimit.used}），重置于 ${formatResetTime(rateLimit.reset)}`
    : "点击查询 GitHub API 剩余额度"

  const handleQuickAdd = async () => {
    const input = quickUrl.trim()
    if (!input || quickAdding) return

    setQuickAdding(true)
    try {
      await addRepoFromUrl(input)
      toast.success("已添加项目")
      setQuickUrl("")
    } catch (err) {
      toast.error("添加失败", { description: String(err) })
    } finally {
      setQuickAdding(false)
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:px-6">
      <Button onClick={onCreate}>
        <PlusIcon />
        <span>新建项目</span>
      </Button>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleQuickAdd()
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={quickUrl}
          onChange={(event) => setQuickUrl(event.target.value)}
          placeholder="粘贴 GitHub 链接或 owner/name 快速添加"
          aria-label="快速添加 GitHub 项目"
          className="h-8 w-72"
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={quickAdding || !quickUrl.trim()}
        >
          {quickAdding ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <WandSparklesIcon />
          )}
          <span>快速添加</span>
        </Button>
      </form>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索名称、简介、备注或标签"
          aria-label="搜索项目"
          className="h-8 w-60 pl-8"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {repos.length} 个项目 · {starredCount} 个重要
        </span>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1 text-xs tabular-nums",
            rateLimitLow ? "text-destructive" : "text-muted-foreground"
          )}
          onClick={() => void refreshRateLimit()}
          title={rateLimitTitle}
          aria-label="刷新 API 剩余额度"
        >
          <GaugeIcon className="size-3.5" />
          <span>
            {rateLimit ? `${rateLimit.remaining}/${rateLimit.limit}` : "--"}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refreshAll()}
          disabled={refreshing || repos.length === 0}
        >
          {refreshing ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <RefreshCwIcon />
          )}
          <span>全部刷新</span>
        </Button>
        <Select
          value={sortKey}
          onValueChange={(value) => setSortKey(value as RepoSortKey)}
          items={SORT_ITEMS}
        >
          <SelectTrigger size="sm" aria-label="排序方式">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenSettings}
          aria-label="设置"
        >
          <SettingsIcon />
        </Button>
        {panelCollapsed && (
          <Button
            variant="outline"
            size="icon"
            onClick={onExpandPanel}
            aria-label="展开侧边栏"
          >
            <PanelRightOpenIcon />
          </Button>
        )}
      </div>
    </div>
  )
}
