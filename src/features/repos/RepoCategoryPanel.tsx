import { useState } from "react"
import {
  FolderTreeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRepos } from "./ReposContext"

const ROW_BASE =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"

function rowClass(isActive: boolean) {
  return cn(
    ROW_BASE,
    isActive
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "hover:bg-sidebar-accent/60"
  )
}

export function RepoCategoryPanel() {
  const {
    repos,
    categories,
    view,
    setView,
    addCategory,
    renameCategory,
    removeCategory,
  } = useRepos()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const countOf = (name: string) =>
    repos.filter((repo) => repo.category === name).length
  const uncategorizedCount = repos.filter((repo) => !repo.category).length

  const closeCreate = () => {
    setCreating(false)
    setNewName("")
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) {
      closeCreate()
      return
    }
    try {
      await addCategory(name)
      closeCreate()
      toast.success(`已新建分类「${name}」`)
    } catch (err) {
      toast.error("新建分类失败", { description: String(err) })
    }
  }

  const handleRename = async (oldName: string) => {
    const name = editName.trim()
    if (!name || name === oldName) {
      setEditing(null)
      return
    }
    try {
      await renameCategory(oldName, name)
      if (view === `category:${oldName}`) setView(`category:${name}`)
      setEditing(null)
      toast.success("已重命名分类")
    } catch (err) {
      toast.error("重命名失败", { description: String(err) })
    }
  }

  const handleRemove = async (name: string) => {
    try {
      await removeCategory(name)
      if (view === `category:${name}`) setView("all")
      toast.success(`已删除分类「${name}」`)
    } catch (err) {
      toast.error("删除分类失败", { description: String(err) })
    }
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar/40">
      <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
        <span className="flex-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          分类
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={() => {
            setCreating(true)
            setNewName("")
          }}
          aria-label="新建分类"
        >
          <PlusIcon />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-gutter:stable]">
        {creating && (
          <div className="mb-1 px-1">
            <Input
              value={newName}
              autoFocus
              placeholder="分类名称，回车确认"
              className="h-7"
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void handleCreate()
                }
                if (event.key === "Escape") closeCreate()
              }}
              onBlur={() => void handleCreate()}
            />
          </div>
        )}

        <ul className="flex flex-col gap-0.5">
          <li>
            <button
              type="button"
              onClick={() => setView("all")}
              className={rowClass(view === "all")}
            >
              <FolderTreeIcon className="size-4" />
              <span className="flex-1 text-left">全部</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {repos.length}
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setView("uncategorized")}
              className={rowClass(view === "uncategorized")}
            >
              <span className="size-4" />
              <span className="flex-1 text-left">未分类</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {uncategorizedCount}
              </span>
            </button>
          </li>
        </ul>

        <div className="my-1 h-px bg-border" />

        <ul className="flex flex-col gap-0.5">
          {categories.map((category) => {
            const value = `category:${category}` as const

            if (editing === category) {
              return (
                <li key={category} className="px-1 py-0.5">
                  <Input
                    value={editName}
                    autoFocus
                    className="h-7"
                    onChange={(event) => setEditName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        void handleRename(category)
                      }
                      if (event.key === "Escape") setEditing(null)
                    }}
                    onBlur={() => void handleRename(category)}
                  />
                </li>
              )
            }

            return (
              <li key={category}>
                <div className={cn(rowClass(view === value), "group/cat pr-1")}>
                  <button
                    type="button"
                    onClick={() => setView(value)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <TagIcon className="size-4 shrink-0" />
                    <span className="truncate">{category}</span>
                  </button>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {countOf(category)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="size-5 shrink-0 opacity-0 group-hover/cat:opacity-100 focus-visible:opacity-100"
                          aria-label="分类操作"
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(category)
                          setEditName(category)
                        }}
                      >
                        <PencilIcon />
                        <span>重命名</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => void handleRemove(category)}
                      >
                        <Trash2Icon />
                        <span>删除</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            )
          })}
        </ul>

        {categories.length === 0 && !creating && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            还没有分类，点击右上角 + 新建
          </p>
        )}
      </div>
    </aside>
  )
}
