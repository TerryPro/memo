import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  CalendarDaysIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StickyNoteIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTodos } from "./TodosContext"
import { PRIORITY_STYLES, formatDueDate, isOverdue } from "./priority"
import type { Todo } from "./types"

interface TodoItemProps {
  todo: Todo
  dragEnabled: boolean
  onEdit: (todo: Todo) => void
}

export function TodoItem({ todo, dragEnabled, onEdit }: TodoItemProps) {
  const { toggleTodo, removeTodo } = useTodos()

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: !dragEnabled })

  const overdue = isOverdue(todo.dueDate, todo.completed)
  const dueLabel = formatDueDate(todo.dueDate)
  const priorityStyle = PRIORITY_STYLES[todo.priority]
  const hasMeta =
    dueLabel !== null ||
    todo.category !== null ||
    todo.tags.length > 0 ||
    todo.notes !== null

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 transition-colors",
        isDragging && "z-10 opacity-80 shadow-md",
        todo.completed && "opacity-60"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        disabled={!dragEnabled}
        aria-label="拖拽排序"
        className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-30"
      >
        <GripVerticalIcon className="size-4" />
      </button>

      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => void toggleTodo(todo.id)}
        aria-label={todo.completed ? "标记为未完成" : "标记为已完成"}
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            todo.completed && "line-through"
          )}
        >
          {todo.title}
        </p>

        {hasMeta && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {dueLabel && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  overdue && "text-destructive"
                )}
              >
                <CalendarDaysIcon className="size-3" />
                {dueLabel}
              </span>
            )}
            {todo.category && (
              <span className="inline-flex items-center gap-1">
                <TagIcon className="size-3" />
                {todo.category}
              </span>
            )}
            {todo.notes && (
              <span className="inline-flex items-center gap-1">
                <StickyNoteIcon className="size-3" />
                备注
              </span>
            )}
            {todo.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="h-4 px-1.5 text-[0.65rem] font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {todo.priority !== "none" && (
        <Badge className={cn("shrink-0", priorityStyle.badge)}>
          {priorityStyle.label}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-open:opacity-100"
              aria-label="更多操作"
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(todo)}>
            <PencilIcon />
            <span>编辑</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void removeTodo(todo.id)}
          >
            <Trash2Icon />
            <span>删除</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
