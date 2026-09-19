export type TodoPriority = "none" | "low" | "medium" | "high"

export interface Todo {
  id: string
  title: string
  notes: string | null
  completed: boolean
  priority: TodoPriority
  dueDate: string | null
  category: string | null
  tags: string[]
  position: number
  createdAt: number
  updatedAt: number
  completedAt: number | null
}

export interface TodoDraft {
  title: string
  notes: string | null
  priority: TodoPriority
  dueDate: string | null
  category: string | null
  tags: string[]
}

export type TodoView =
  "all" | "today" | "upcoming" | "completed" | `category:${string}`

export type TodoSortKey = "manual" | "due" | "priority" | "created"
