import { createContext, useContext } from "react"
import type {
  RateLimit,
  Repo,
  RepoDraft,
  RepoSortKey,
  RepoSettings,
  RepoView,
} from "./types"

export interface ReposContextValue {
  repos: Repo[]
  visibleRepos: Repo[]
  categories: string[]
  starredCount: number
  loading: boolean
  error: string | null
  settings: RepoSettings
  saveSettings: (settings: RepoSettings) => Promise<void>
  rateLimit: RateLimit | null
  refreshRateLimit: () => Promise<void>
  view: RepoView
  setView: (view: RepoView) => void
  sortKey: RepoSortKey
  setSortKey: (key: RepoSortKey) => void
  search: string
  setSearch: (value: string) => void
  addRepo: (draft: RepoDraft) => Promise<void>
  addRepoFromUrl: (input: string) => Promise<void>
  updateRepo: (id: string, patch: Partial<RepoDraft>) => Promise<void>
  removeRepo: (id: string) => Promise<void>
  toggleStar: (id: string) => Promise<void>
  reorder: (orderedIds: string[]) => Promise<void>
  addCategory: (name: string) => Promise<void>
  renameCategory: (oldName: string, newName: string) => Promise<void>
  removeCategory: (name: string) => Promise<void>
  setRepoCategory: (id: string, category: string | null) => Promise<void>
  refreshRepo: (id: string) => Promise<void>
  refreshAll: () => Promise<void>
  refreshingIds: string[]
}

export const ReposContext = createContext<ReposContextValue | null>(null)

export function useRepos() {
  const context = useContext(ReposContext)
  if (!context) {
    throw new Error("useRepos must be used within a ReposProvider")
  }
  return context
}
