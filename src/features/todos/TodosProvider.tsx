import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { loadTodos, saveTodos } from "@/lib/todos"
import { TodosContext } from "./TodosContext"
import { PRIORITY_ORDER, isDueToday, isUpcoming } from "./priority"
import type { Todo, TodoDraft, TodoSortKey, TodoView } from "./types"

function sortTodos(todos: Todo[], sortKey: TodoSortKey): Todo[] {
  const next = [...todos]

  switch (sortKey) {
    case "manual":
      next.sort((a, b) => a.position - b.position)
      break
    case "due":
      next.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return a.position - b.position
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      })
      break
    case "priority":
      next.sort((a, b) => {
        const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        return diff !== 0 ? diff : a.position - b.position
      })
      break
    case "created":
      next.sort((a, b) => b.createdAt - a.createdAt)
      break
  }

  return next
}

function normalizeTodo(todo: Todo): Todo {
  return {
    ...todo,
    notes: todo.notes ?? null,
    dueDate: todo.dueDate ?? null,
    category: todo.category ?? null,
    tags: todo.tags ?? [],
    completedAt: todo.completedAt ?? null,
  }
}

function matchesView(todo: Todo, view: TodoView): boolean {
  if (view === "today") return isDueToday(todo.dueDate)
  if (view === "upcoming") return !todo.completed && isUpcoming(todo.dueDate)
  if (view === "completed") return todo.completed
  if (view.startsWith("category:")) {
    return todo.category === view.slice("category:".length)
  }
  return true
}

export function TodosProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<TodoView>("all")
  const [sortKey, setSortKey] = useState<TodoSortKey>("manual")
  const [search, setSearch] = useState("")

  useEffect(() => {
    let cancelled = false

    loadTodos()
      .then((loaded) => {
        if (!cancelled) setTodos(loaded.map(normalizeTodo))
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback(async (next: Todo[]) => {
    setTodos(next)
    try {
      await saveTodos(next)
      setError(null)
    } catch (err) {
      setError(String(err))
    }
  }, [])

  const addTodo = useCallback(
    async (draft: TodoDraft) => {
      const now = Date.now()
      const maxPosition = todos.reduce(
        (max, todo) => Math.max(max, todo.position),
        0
      )
      const todo: Todo = {
        id: crypto.randomUUID(),
        title: draft.title,
        notes: draft.notes,
        priority: draft.priority,
        dueDate: draft.dueDate,
        category: draft.category,
        tags: draft.tags,
        completed: false,
        position: maxPosition + 1,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      }
      await persist([...todos, todo])
    },
    [todos, persist]
  )

  const updateTodo = useCallback(
    async (id: string, patch: Partial<TodoDraft>) => {
      await persist(
        todos.map((todo) =>
          todo.id === id ? { ...todo, ...patch, updatedAt: Date.now() } : todo
        )
      )
    },
    [todos, persist]
  )

  const removeTodo = useCallback(
    async (id: string) => {
      await persist(todos.filter((todo) => todo.id !== id))
    },
    [todos, persist]
  )

  const toggleTodo = useCallback(
    async (id: string) => {
      await persist(
        todos.map((todo) => {
          if (todo.id !== id) return todo
          const completed = !todo.completed
          return {
            ...todo,
            completed,
            completedAt: completed ? Date.now() : null,
            updatedAt: Date.now(),
          }
        })
      )
    },
    [todos, persist]
  )

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      const positionMap = new Map(orderedIds.map((id, index) => [id, index]))
      await persist(
        todos.map((todo) => {
          const next = positionMap.get(todo.id)
          return next === undefined ? todo : { ...todo, position: next }
        })
      )
    },
    [todos, persist]
  )

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const todo of todos) {
      if (todo.category) set.add(todo.category)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [todos])

  const activeCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos]
  )

  const visibleTodos = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    let filtered = todos.filter((todo) => matchesView(todo, view))

    if (keyword) {
      filtered = filtered.filter(
        (todo) =>
          todo.title.toLowerCase().includes(keyword) ||
          (todo.notes?.toLowerCase().includes(keyword) ?? false)
      )
    }

    return sortTodos(filtered, sortKey)
  }, [todos, view, search, sortKey])

  const value = useMemo(
    () => ({
      todos,
      visibleTodos,
      categories,
      activeCount,
      loading,
      error,
      view,
      setView,
      sortKey,
      setSortKey,
      search,
      setSearch,
      addTodo,
      updateTodo,
      removeTodo,
      toggleTodo,
      reorder,
    }),
    [
      todos,
      visibleTodos,
      categories,
      activeCount,
      loading,
      error,
      view,
      sortKey,
      search,
      addTodo,
      updateTodo,
      removeTodo,
      toggleTodo,
      reorder,
    ]
  )

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>
}
