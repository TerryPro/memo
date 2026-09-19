import { trackedInvoke } from "@/lib/tauri"
import type { Todo } from "@/features/todos/types"

export function loadTodos() {
  return trackedInvoke<Todo[]>("load_todos")
}

export function saveTodos(todos: Todo[]) {
  return trackedInvoke<void>("save_todos", { todos })
}
