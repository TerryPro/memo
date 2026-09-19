import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import {
  checkRateLimit,
  fetchRepo,
  loadRepoCategories,
  loadRepos,
  loadSettings,
  saveRepoCategories,
  saveRepos,
  saveSettings as persistSettings,
} from "@/lib/repos"
import { ReposContext } from "./ReposContext"
import { parseRepoInput } from "./repoMeta"
import type {
  RateLimit,
  Repo,
  RepoDraft,
  RepoFetched,
  RepoSortKey,
  RepoSettings,
  RepoView,
} from "./types"

const DEFAULT_SETTINGS: RepoSettings = {
  githubToken: null,
  autoSyncOnOpen: false,
}

const RATE_LIMIT_HINT = "速率限制"

function normalizeRepo(repo: Repo): Repo {
  return {
    ...repo,
    description: repo.description ?? null,
    homepage: repo.homepage ?? null,
    language: repo.language ?? null,
    license: repo.license ?? null,
    topics: repo.topics ?? [],
    stars: repo.stars ?? null,
    forks: repo.forks ?? null,
    watchers: repo.watchers ?? null,
    openIssues: repo.openIssues ?? null,
    pushedAt: repo.pushedAt ?? null,
    latestRelease: repo.latestRelease ?? null,
    releasePublishedAt: repo.releasePublishedAt ?? null,
    releaseUrl: repo.releaseUrl ?? null,
    category: repo.category ?? null,
    tags: repo.tags ?? [],
    starred: repo.starred ?? false,
    status: repo.status ?? "watching",
    notes: repo.notes ?? null,
    lastSyncedAt: repo.lastSyncedAt ?? null,
  }
}

function mergeFetched(repo: Repo, fetched: RepoFetched): Repo {
  const now = Date.now()
  return {
    ...repo,
    description: fetched.description ?? null,
    homepage: fetched.homepage ?? null,
    language: fetched.language ?? null,
    license: fetched.license ?? null,
    topics: fetched.topics ?? [],
    stars: fetched.stars ?? null,
    forks: fetched.forks ?? null,
    watchers: fetched.watchers ?? null,
    openIssues: fetched.openIssues ?? null,
    pushedAt: fetched.pushedAt ?? null,
    latestRelease: fetched.latestRelease ?? null,
    releasePublishedAt: fetched.releasePublishedAt ?? null,
    releaseUrl: fetched.releaseUrl ?? null,
    lastSyncedAt: now,
    updatedAt: now,
  }
}

function buildRepo(
  owner: string,
  name: string,
  fetched: RepoFetched,
  position: number
): Repo {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    owner,
    name,
    fullName: `${owner}/${name}`,
    description: fetched.description ?? null,
    homepage: fetched.homepage ?? null,
    language: fetched.language ?? null,
    license: fetched.license ?? null,
    topics: fetched.topics ?? [],
    stars: fetched.stars ?? null,
    forks: fetched.forks ?? null,
    watchers: fetched.watchers ?? null,
    openIssues: fetched.openIssues ?? null,
    pushedAt: fetched.pushedAt ?? null,
    latestRelease: fetched.latestRelease ?? null,
    releasePublishedAt: fetched.releasePublishedAt ?? null,
    releaseUrl: fetched.releaseUrl ?? null,
    category: null,
    tags: [],
    starred: false,
    status: "watching",
    notes: null,
    position,
    createdAt: now,
    updatedAt: now,
    lastSyncedAt: now,
  }
}

function sortRepos(repos: Repo[], sortKey: RepoSortKey): Repo[] {
  const next = [...repos]

  switch (sortKey) {
    case "manual":
      next.sort((a, b) => a.position - b.position)
      break
    case "name":
      next.sort((a, b) =>
        a.fullName.toLowerCase().localeCompare(b.fullName.toLowerCase())
      )
      break
    case "stars":
      next.sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1))
      break
    case "pushed":
      next.sort((a, b) => (b.pushedAt ?? 0) - (a.pushedAt ?? 0))
      break
    case "updated":
      next.sort((a, b) => b.updatedAt - a.updatedAt)
      break
  }

  return next
}

function matchesView(repo: Repo, view: RepoView): boolean {
  if (view === "all") return true
  if (view === "starred") return repo.starred
  if (view === "uncategorized") return repo.category === null
  if (view === "watching" || view === "evaluating" || view === "archived") {
    return repo.status === view
  }
  if (view.startsWith("category:")) {
    return repo.category === view.slice("category:".length)
  }
  return true
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ReposProvider({ children }: { children: ReactNode }) {
  const [repos, setRepos] = useState<Repo[]>([])
  const [settings, setSettings] = useState<RepoSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<RepoView>("all")
  const [sortKey, setSortKey] = useState<RepoSortKey>("manual")
  const [search, setSearch] = useState("")
  const [refreshingIds, setRefreshingIds] = useState<string[]>([])
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const autoSyncDone = useRef(false)

  const syncRateLimit = useCallback(async (token: string | null) => {
    try {
      const result = await checkRateLimit(token)
      setRateLimit(result)
    } catch {
      // 速率限额查询失败时静默忽略，不影响主流程
    }
  }, [])

  const persistCategories = useCallback(async (next: string[]) => {
    setCategories(next)
    try {
      await saveRepoCategories(next)
    } catch {
      // 分类写盘失败时静默忽略，内存仍可用
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([loadRepos(), loadSettings(), loadRepoCategories()])
      .then(([loadedRepos, loadedSettings, loadedCategories]) => {
        if (cancelled) return
        const normalized = loadedRepos.map(normalizeRepo)
        setRepos(normalized)
        setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings })

        // 合并已保存的分类与项目里出现的分类，避免既有数据丢失
        const merged = [...loadedCategories]
        const known = new Set(merged.map((item) => item.toLowerCase()))
        for (const repo of normalized) {
          const value = repo.category
          if (value && !known.has(value.toLowerCase())) {
            merged.push(value)
            known.add(value.toLowerCase())
          }
        }
        setCategories(merged)
        if (merged.length !== loadedCategories.length) {
          void saveRepoCategories(merged)
        }

        void syncRateLimit(loadedSettings.githubToken)
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
  }, [syncRateLimit])

  const persist = useCallback(async (next: Repo[]) => {
    setRepos(next)
    try {
      await saveRepos(next)
      setError(null)
    } catch (err) {
      setError(String(err))
    }
  }, [])

  const saveSettings = useCallback(
    async (next: RepoSettings) => {
      setSettings(next)
      try {
        await persistSettings(next)
        setError(null)
        void syncRateLimit(next.githubToken)
      } catch (err) {
        setError(String(err))
      }
    },
    [syncRateLimit]
  )

  const refreshRateLimit = useCallback(async () => {
    await syncRateLimit(settings.githubToken)
  }, [syncRateLimit, settings.githubToken])

  const addCategory = useCallback(
    async (rawName: string) => {
      const name = rawName.trim()
      if (!name) return
      if (categories.some((item) => item.toLowerCase() === name.toLowerCase())) {
        throw new Error(`分类「${name}」已存在`)
      }
      await persistCategories([...categories, name])
    },
    [categories, persistCategories]
  )

  const renameCategory = useCallback(
    async (oldName: string, rawName: string) => {
      const name = rawName.trim()
      if (!name || name === oldName) return
      if (
        categories.some(
          (item) =>
            item.toLowerCase() === name.toLowerCase() && item !== oldName
        )
      ) {
        throw new Error(`分类「${name}」已存在`)
      }

      await persistCategories(
        categories.map((item) => (item === oldName ? name : item))
      )
      if (repos.some((repo) => repo.category === oldName)) {
        await persist(
          repos.map((repo) =>
            repo.category === oldName
              ? { ...repo, category: name, updatedAt: Date.now() }
              : repo
          )
        )
      }
    },
    [categories, repos, persistCategories, persist]
  )

  const removeCategory = useCallback(
    async (name: string) => {
      await persistCategories(categories.filter((item) => item !== name))
      if (repos.some((repo) => repo.category === name)) {
        await persist(
          repos.map((repo) =>
            repo.category === name
              ? { ...repo, category: null, updatedAt: Date.now() }
              : repo
          )
        )
      }
    },
    [categories, repos, persistCategories, persist]
  )

  const setRepoCategory = useCallback(
    async (id: string, category: string | null) => {
      await persist(
        repos.map((repo) =>
          repo.id === id ? { ...repo, category, updatedAt: Date.now() } : repo
        )
      )
    },
    [repos, persist]
  )

  const addRepo = useCallback(
    async (draft: RepoDraft) => {
      const now = Date.now()
      const maxPosition = repos.reduce(
        (max, repo) => Math.max(max, repo.position),
        0
      )
      const repo: Repo = {
        ...draft,
        id: crypto.randomUUID(),
        fullName: `${draft.owner}/${draft.name}`,
        pushedAt: null,
        releasePublishedAt: null,
        position: maxPosition + 1,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: null,
      }
      await persist([...repos, repo])
      if (repo.category && !categories.includes(repo.category)) {
        await persistCategories([...categories, repo.category])
      }
    },
    [repos, persist, categories, persistCategories]
  )

  const addRepoFromUrl = useCallback(
    async (input: string) => {
      const parsed = parseRepoInput(input)
      if (!parsed) {
        throw new Error("无法解析 GitHub 地址，请输入 owner/name 或完整链接")
      }

      const fullName = `${parsed.owner}/${parsed.name}`
      const exists = repos.some(
        (repo) => repo.fullName.toLowerCase() === fullName.toLowerCase()
      )
      if (exists) {
        throw new Error(`${fullName} 已在列表中`)
      }

      const fetched = await fetchRepo(
        parsed.owner,
        parsed.name,
        settings.githubToken
      )
      const maxPosition = repos.reduce(
        (max, repo) => Math.max(max, repo.position),
        0
      )
      await persist([
        ...repos,
        buildRepo(parsed.owner, parsed.name, fetched, maxPosition + 1),
      ])
      void syncRateLimit(settings.githubToken)
    },
    [repos, persist, settings.githubToken, syncRateLimit]
  )

  const updateRepo = useCallback(
    async (id: string, patch: Partial<RepoDraft>) => {
      await persist(
        repos.map((repo) => {
          if (repo.id !== id) return repo
          const merged = { ...repo, ...patch, updatedAt: Date.now() }
          merged.fullName = `${merged.owner}/${merged.name}`
          return merged
        })
      )
      const nextCategory = patch.category
      if (
        typeof nextCategory === "string" &&
        nextCategory &&
        !categories.includes(nextCategory)
      ) {
        await persistCategories([...categories, nextCategory])
      }
    },
    [repos, persist, categories, persistCategories]
  )

  const removeRepo = useCallback(
    async (id: string) => {
      await persist(repos.filter((repo) => repo.id !== id))
    },
    [repos, persist]
  )

  const toggleStar = useCallback(
    async (id: string) => {
      await persist(
        repos.map((repo) =>
          repo.id === id
            ? { ...repo, starred: !repo.starred, updatedAt: Date.now() }
            : repo
        )
      )
    },
    [repos, persist]
  )

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      const positionMap = new Map(orderedIds.map((id, index) => [id, index]))
      await persist(
        repos.map((repo) => {
          const next = positionMap.get(repo.id)
          return next === undefined ? repo : { ...repo, position: next }
        })
      )
    },
    [repos, persist]
  )

  const starredCount = useMemo(
    () => repos.filter((repo) => repo.starred).length,
    [repos]
  )

  const visibleRepos = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    let filtered = repos.filter((repo) => matchesView(repo, view))

    if (keyword) {
      filtered = filtered.filter(
        (repo) =>
          repo.fullName.toLowerCase().includes(keyword) ||
          (repo.description?.toLowerCase().includes(keyword) ?? false) ||
          (repo.notes?.toLowerCase().includes(keyword) ?? false) ||
          (repo.category?.toLowerCase().includes(keyword) ?? false) ||
          repo.tags.some((tag) => tag.toLowerCase().includes(keyword))
      )
    }

    return sortRepos(filtered, sortKey)
  }, [repos, view, search, sortKey])

  const refreshRepo = useCallback(
    async (id: string) => {
      const repo = repos.find((item) => item.id === id)
      if (!repo) return

      setRefreshingIds((prev) =>
        prev.includes(id) ? prev : [...prev, id]
      )
      try {
        const fetched = await fetchRepo(repo.owner, repo.name, settings.githubToken)
        await persist(
          repos.map((item) =>
            item.id === id ? mergeFetched(item, fetched) : item
          )
        )
        void syncRateLimit(settings.githubToken)
        toast.success(`已刷新 ${repo.fullName}`)
      } catch (err) {
        const message = String(err)
        setError(message)
        toast.error(`${repo.fullName} 刷新失败`, { description: message })
      } finally {
        setRefreshingIds((prev) => prev.filter((item) => item !== id))
      }
    },
    [repos, persist, settings.githubToken, syncRateLimit]
  )

  const refreshAll = useCallback(async () => {
    const queue = [...visibleRepos]
    if (queue.length === 0) return

    setError(null)
    let working = repos
    let success = 0
    let failed = 0

    for (let index = 0; index < queue.length; index += 1) {
      const repo = queue[index]
      setRefreshingIds((prev) => [...prev, repo.id])
      try {
        const fetched = await fetchRepo(repo.owner, repo.name, settings.githubToken)
        working = working.map((item) =>
          item.id === repo.id ? mergeFetched(item, fetched) : item
        )
        setRepos(working)
        await saveRepos(working)
        success += 1
      } catch (err) {
        failed += 1
        const message = String(err)
        setError(message)
        if (message.includes(RATE_LIMIT_HINT)) {
          toast.error("已触达 GitHub 速率限制，批量刷新已中止", {
            description: message,
          })
          setRefreshingIds((prev) => prev.filter((item) => item !== repo.id))
          break
        }
      } finally {
        setRefreshingIds((prev) => prev.filter((item) => item !== repo.id))
      }

      if (index < queue.length - 1) {
        await sleep(1000)
      }
    }

    if (success > 0 || failed > 0) {
      toast.success(
        `批量刷新完成：成功 ${success} 个${failed ? `，失败 ${failed} 个` : ""}`
      )
    }
    void syncRateLimit(settings.githubToken)
  }, [repos, visibleRepos, settings.githubToken, syncRateLimit])

  useEffect(() => {
    if (loading || autoSyncDone.current) return
    if (!settings.autoSyncOnOpen) return
    if (repos.length === 0) return
    autoSyncDone.current = true
    const timer = setTimeout(() => {
      void refreshAll()
    }, 0)
    return () => clearTimeout(timer)
  }, [loading, settings.autoSyncOnOpen, repos.length, refreshAll])

  const value = useMemo(
    () => ({
      repos,
      visibleRepos,
      categories,
      starredCount,
      loading,
      error,
      settings,
      saveSettings,
      rateLimit,
      refreshRateLimit,
      view,
      setView,
      sortKey,
      setSortKey,
      search,
      setSearch,
      addRepo,
      addRepoFromUrl,
      updateRepo,
      removeRepo,
      addCategory,
      renameCategory,
      removeCategory,
      setRepoCategory,
      toggleStar,
      reorder,
      refreshRepo,
      refreshAll,
      refreshingIds,
    }),
    [
      repos,
      visibleRepos,
      categories,
      starredCount,
      loading,
      error,
      settings,
      saveSettings,
      rateLimit,
      refreshRateLimit,
      view,
      sortKey,
      search,
      addRepo,
      addRepoFromUrl,
      updateRepo,
      removeRepo,
      addCategory,
      renameCategory,
      removeCategory,
      setRepoCategory,
      toggleStar,
      reorder,
      refreshRepo,
      refreshAll,
      refreshingIds,
    ]
  )

  return <ReposContext.Provider value={value}>{children}</ReposContext.Provider>
}
