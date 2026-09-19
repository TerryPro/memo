import { useState } from "react"
import { TodoEditorSheet } from "@/features/todos/TodoEditorSheet"
import { TodoList } from "@/features/todos/TodoList"
import { TodoSidebar } from "@/features/todos/TodoSidebar"
import { useTodos } from "@/features/todos/TodosContext"
import { TodoToolbar } from "@/features/todos/TodoToolbar"
import type { Todo, TodoDraft } from "@/features/todos/types"

export function TodoPage() {
  const { error, categories, addTodo, updateTodo } = useTodos()
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const handleCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const handleEdit = (todo: Todo) => {
    setEditing(todo)
    setEditorOpen(true)
  }

  const handleSubmit = async (draft: TodoDraft) => {
    if (editing) {
      await updateTodo(editing.id, draft)
    } else {
      await addTodo(draft)
    }
  }

  return (
    <div className="flex h-[calc(100dvh_-_var(--header-height))] flex-col overflow-hidden md:h-[calc(100dvh_-_var(--header-height)_-_1rem)]">
      <TodoToolbar
        onCreate={handleCreate}
        panelCollapsed={panelCollapsed}
        onExpandPanel={() => setPanelCollapsed(false)}
      />

      {error && (
        <div className="shrink-0 px-4 pb-2 lg:px-6">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-3 lg:px-6">
          <TodoList onEdit={handleEdit} />
        </div>

        {!panelCollapsed && (
          <TodoSidebar onCollapse={() => setPanelCollapsed(true)} />
        )}
      </div>

      <TodoEditorSheet
        key={editing?.id ?? "new"}
        todo={editing}
        open={editorOpen}
        categories={categories}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
