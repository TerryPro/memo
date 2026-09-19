import { trackedInvoke } from "@/lib/tauri"
import type {
  RateLimit,
  Repo,
  RepoFetched,
  RepoSettings,
} from "@/features/repos/types"

export function loadRepos() {
  return trackedInvoke<Repo[]>("load_repos")
}

export function saveRepos(repos: Repo[]) {
  return trackedInvoke<void>("save_repos", { repos })
}

export function loadSettings() {
  return trackedInvoke<RepoSettings>("load_settings")
}

export function saveSettings(settings: RepoSettings) {
  return trackedInvoke<void>("save_settings", { settings })
}

export function fetchRepo(owner: string, name: string, token: string | null) {
  return trackedInvoke<RepoFetched>("fetch_repo", { owner, name, token })
}

export function checkRateLimit(token: string | null) {
  return trackedInvoke<RateLimit>("check_rate_limit", { token })
}

export function loadRepoCategories() {
  return trackedInvoke<string[]>("load_repo_categories")
}

export function saveRepoCategories(categories: string[]) {
  return trackedInvoke<void>("save_repo_categories", { categories })
}
