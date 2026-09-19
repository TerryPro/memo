import { useMemo, useState } from "react"
import { RepoCategoryPanel } from "@/features/repos/RepoCategoryPanel"
import { RepoDeleteDialog } from "@/features/repos/RepoDeleteDialog"
import { RepoEditorSheet } from "@/features/repos/RepoEditorSheet"
import { RepoSettingsSheet } from "@/features/repos/RepoSettingsSheet"
import { RepoSidebar } from "@/features/repos/RepoSidebar"
import { RepoTable } from "@/features/repos/RepoTable"
import { RepoToolbar } from "@/features/repos/RepoToolbar"
import { useRepos } from "@/features/repos/ReposContext"
import type { Repo, RepoDraft } from "@/features/repos/types"

export function RepoPage() {
  const { error, repos, categories, addRepo, updateRepo, removeRepo } =
    useRepos()
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [editing, setEditing] = useState<Repo | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleting, setDeleting] = useState<Repo | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const existingFullNames = useMemo(
    () => repos.map((repo) => repo.fullName),
    [repos]
  )

  const handleCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const handleEdit = (repo: Repo) => {
    setEditing(repo)
    setEditorOpen(true)
  }

  const handleSubmit = async (draft: RepoDraft) => {
    if (editing) {
      await updateRepo(editing.id, draft)
    } else {
      await addRepo(draft)
    }
  }

  const handleDelete = (repo: Repo) => {
    setDeleting(repo)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (deleting) {
      await removeRepo(deleting.id)
    }
    setDeleteOpen(false)
    setDeleting(null)
  }

  return (
    <div className="flex h-[calc(100dvh_-_var(--header-height))] flex-col overflow-hidden md:h-[calc(100dvh_-_var(--header-height)_-_1rem)]">
      <RepoToolbar
        onCreate={handleCreate}
        onOpenSettings={() => setSettingsOpen(true)}
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
        <RepoCategoryPanel />

        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-3 [scrollbar-gutter:stable] lg:px-6">
          <RepoTable onEdit={handleEdit} onDelete={handleDelete} />
        </div>

        {!panelCollapsed && (
          <RepoSidebar onCollapse={() => setPanelCollapsed(true)} />
        )}
      </div>

      <RepoEditorSheet
        key={editing?.id ?? "new"}
        repo={editing}
        open={editorOpen}
        categories={categories}
        existingFullNames={existingFullNames}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <RepoSettingsSheet
        key={settingsOpen ? "settings-open" : "settings-closed"}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <RepoDeleteDialog
        repo={deleting}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setDeleting(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
