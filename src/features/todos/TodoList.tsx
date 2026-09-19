import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { ClipboardListIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useTodos } from "./TodosContext"
import { TodoItem } from "./TodoItem"
import type { Todo } from "./types"

interface TodoListProps {
  onEdit: (todo: Todo) => void
}

export function TodoList({ onEdit }: TodoListProps) {
  const { visibleTodos, sortKey, reorder, loading } = useTodos()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const dragEnabled = sortKey === "manual"
  const ids = visibleTodos.map((todo) => todo.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    void reorder(arrayMove(ids, oldIndex, newIndex))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (visibleTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ClipboardListIcon className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">没有待办事项</p>
          <p className="text-xs text-muted-foreground">
            点击上方"新建待办"添加一条
          </p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {visibleTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              dragEnabled={dragEnabled}
              onEdit={onEdit}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
