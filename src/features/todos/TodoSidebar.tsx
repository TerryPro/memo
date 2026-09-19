import type { ReactNode } from "react"
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  CheckCheckIcon,
  ListIcon,
  PanelRightCloseIcon,
  TagIcon,
} from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { useTodos } from "./TodosContext"
import { isDueToday, isUpcoming } from "./priority"

type SmartView = "all" | "today" | "upcoming" | "completed"

const ROW_BASE =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"

const SMART_VIEWS: { label: string; value: SmartView; icon: ReactNode }[] = [
  { label: "全部", value: "all", icon: <ListIcon className="size-4" /> },
  {
    label: "今天",
    value: "today",
    icon: <CalendarDaysIcon className="size-4" />,
  },
  {
    label: "即将到期",
    value: "upcoming",
    icon: <CalendarClockIcon className="size-4" />,
  },
  {
    label: "已完成",
    value: "completed",
    icon: <CheckCheckIcon className="size-4" />,
  },
]

function rowClass(isActive: boolean) {
  return cn(
    ROW_BASE,
    isActive
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "hover:bg-sidebar-accent/60"
  )
}

interface TodoSidebarProps {
  onCollapse: () => void
}

export function TodoSidebar({ onCollapse }: TodoSidebarProps) {
  const { todos, categories, view, setView, activeCount } = useTodos()

  const counts: Record<SmartView, number> = {
    all: todos.length,
    today: todos.filter((todo) => isDueToday(todo.dueDate)).length,
    upcoming: todos.filter(
      (todo) => !todo.completed && isUpcoming(todo.dueDate)
    ).length,
    completed: todos.filter((todo) => todo.completed).length,
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l bg-sidebar/40">
      <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
        <span className="flex-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          待办
        </span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
          {activeCount}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
          onClick={onCollapse}
          aria-label="折叠侧边栏"
        >
          <PanelRightCloseIcon />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-0.5">
          {SMART_VIEWS.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                onClick={() => setView(item.value)}
                className={rowClass(view === item.value)}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {counts[item.value]}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {categories.length > 0 && (
          <>
            <div className="my-2 h-px bg-border" />
            <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
              分类
            </p>
            <ul className="flex flex-col gap-0.5">
              {categories.map((category) => {
                const value = `category:${category}` as const
                return (
                  <li key={category}>
                    <button
                      type="button"
                      onClick={() => setView(value)}
                      className={rowClass(view === value)}
                    >
                      <TagIcon className="size-4" />
                      <span className="flex-1 truncate text-left">
                        {category}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {
                          todos.filter((todo) => todo.category === category)
                            .length
                        }
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </aside>
  )
}
