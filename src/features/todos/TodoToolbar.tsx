import { PanelRightOpenIcon, PlusIcon, SearchIcon } from "lucide-react"
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
import { useTodos } from "./TodosContext"
import type { TodoSortKey } from "./types"

const SORT_ITEMS: { label: string; value: TodoSortKey }[] = [
  { label: "手动排序", value: "manual" },
  { label: "按截止日期", value: "due" },
  { label: "按优先级", value: "priority" },
  { label: "按创建时间", value: "created" },
]

interface TodoToolbarProps {
  onCreate: () => void
  panelCollapsed: boolean
  onExpandPanel: () => void
}

export function TodoToolbar({
  onCreate,
  panelCollapsed,
  onExpandPanel,
}: TodoToolbarProps) {
  const { activeCount, search, setSearch, sortKey, setSortKey } = useTodos()

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:px-6">
      <Button onClick={onCreate}>
        <PlusIcon />
        <span>新建待办</span>
      </Button>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索标题或备注"
          aria-label="搜索待办"
          className="h-8 w-52 pl-8"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {activeCount} 项待完成
        </span>
        <Select
          value={sortKey}
          onValueChange={(value) => setSortKey(value as TodoSortKey)}
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
