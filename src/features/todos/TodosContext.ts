import { createContext, useContext } from "react"
import type { Todo, TodoDraft, TodoSortKey, TodoView } from "./types"

export interface TodosContextValue {
  todos: Todo[]
  visibleTodos: Todo[]
  categories: string[]
  activeCount: number
  loading: boolean
  error: string | null
  view: TodoView
  setView: (view: TodoView) => void
  sortKey: TodoSortKey
  setSortKey: (key: TodoSortKey) => void
  search: string
  setSearch: (value: string) => void
  addTodo: (draft: TodoDraft) => Promise<void>
  updateTodo: (id: string, patch: Partial<TodoDraft>) => Promise<void>
  removeTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  reorder: (orderedIds: string[]) => Promise<void>
}

export const TodosContext = createContext<TodosContextValue | null>(null)

export function useTodos() {
  const context = useContext(TodosContext)
  if (!context) {
    throw new Error("useTodos must be used within a TodosProvider")
  }
  return context
}
