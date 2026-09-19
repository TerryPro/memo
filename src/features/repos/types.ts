export type RepoStatus = "watching" | "evaluating" | "archived"

export interface Repo {
  id: string
  owner: string
  name: string
  fullName: string
  description: string | null
  homepage: string | null
  language: string | null
  license: string | null
  topics: string[]
  stars: number | null
  forks: number | null
  watchers: number | null
  openIssues: number | null
  pushedAt: number | null
  latestRelease: string | null
  releasePublishedAt: number | null
  releaseUrl: string | null
  category: string | null
  tags: string[]
  starred: boolean
  status: RepoStatus
  notes: string | null
  position: number
  createdAt: number
  updatedAt: number
  lastSyncedAt: number | null
}

export interface RepoDraft {
  owner: string
  name: string
  description: string | null
  homepage: string | null
  language: string | null
  license: string | null
  topics: string[]
  stars: number | null
  forks: number | null
  watchers: number | null
  openIssues: number | null
  latestRelease: string | null
  releaseUrl: string | null
  category: string | null
  tags: string[]
  starred: boolean
  status: RepoStatus
  notes: string | null
}

export interface RepoFetched {
  description?: string | null
  homepage?: string | null
  language?: string | null
  license?: string | null
  topics: string[]
  stars?: number | null
  forks?: number | null
  watchers?: number | null
  openIssues?: number | null
  pushedAt?: number | null
  latestRelease?: string | null
  releasePublishedAt?: number | null
  releaseUrl?: string | null
}

export interface RepoSettings {
  githubToken: string | null
  autoSyncOnOpen: boolean
}

export interface RateLimit {
  limit: number
  remaining: number
  used: number
  reset: number
}

export type RepoView =
  | "all"
  | RepoStatus
  | "starred"
  | "uncategorized"
  | `category:${string}`

export type RepoSortKey = "manual" | "name" | "stars" | "pushed" | "updated"
