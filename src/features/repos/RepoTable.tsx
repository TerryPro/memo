import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  CopyIcon,
  ExternalLinkIcon,
  FolderTreeIcon,
  GitForkIcon,
  GripVerticalIcon,
  InboxIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  StarIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRepos } from "./ReposContext"
import {
  STATUS_STYLES,
  formatCount,
  formatRelativeTime,
  githubIssuesUrl,
  githubReleasesUrl,
  githubRepoUrl,
} from "./repoMeta"
import type { Repo } from "./types"

interface RepoRowProps {
  repo: Repo
  dragEnabled: boolean
  onEdit: (repo: Repo) => void
  onDelete: (repo: Repo) => void
}

function RepoRow({ repo, dragEnabled, onEdit, onDelete }: RepoRowProps) {
  const {
    toggleStar,
    refreshRepo,
    refreshingIds,
    categories,
    setRepoCategory,
  } = useRepos()

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: repo.id, disabled: !dragEnabled })

  const refreshing = refreshingIds.includes(repo.id)
  const statusStyle = STATUS_STYLES[repo.status]
  const repoHref = githubRepoUrl(repo.owner, repo.name)
  const releaseHref = repo.releaseUrl ?? githubReleasesUrl(repo.owner, repo.name)

  const handleCopy = () => {
    void navigator.clipboard.writeText(repoHref)
    toast.success("已复制仓库链接")
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "z-10 opacity-80")}
    >
      <TableCell className="w-8">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          disabled={!dragEnabled}
          aria-label="拖拽排序"
          className="flex size-6 cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-30"
        >
          <GripVerticalIcon className="size-4" />
        </button>
      </TableCell>

      <TableCell className="w-8">
        <button
          type="button"
          onClick={() => void toggleStar(repo.id)}
          aria-label={repo.starred ? "取消标记" : "标记为重要"}
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-amber-500"
        >
          <StarIcon
            className={cn(
              "size-4",
              repo.starred && "fill-amber-400 text-amber-500"
            )}
          />
        </button>
      </TableCell>

      <TableCell className="pl-0">
        <a
          href={repoHref}
          className="block truncate font-medium hover:underline"
        >
          {repo.fullName}
        </a>
        {repo.description && (
          <p className="truncate text-xs text-muted-foreground">
            {repo.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {repo.language && (
            <Badge variant="outline" className="font-normal">
              {repo.language}
            </Badge>
          )}
          {repo.license && (
            <Badge variant="ghost" className="font-normal">
              {repo.license}
            </Badge>
          )}
          {repo.category && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <TagIcon className="size-3" />
              {repo.category}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right tabular-nums">
        {formatCount(repo.stars)}
      </TableCell>

      <TableCell className="text-right tabular-nums">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <GitForkIcon className="size-3" />
          {formatCount(repo.forks)}
        </span>
      </TableCell>

      <TableCell>
        {repo.latestRelease ? (
          <a href={releaseHref} className="block truncate text-sm hover:underline">
            {repo.latestRelease}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="text-muted-foreground">
        {formatRelativeTime(repo.pushedAt)}
      </TableCell>

      <TableCell>
        <Badge className={cn("font-normal", statusStyle.badge)}>
          {statusStyle.label}
        </Badge>
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {refreshing ? (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="更多操作"
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={refreshing}
                onClick={() => void refreshRepo(repo.id)}
              >
                <RefreshCwIcon />
                <span>刷新信息</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <a
                    href={repoHref}
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                <ExternalLinkIcon />
                <span>打开仓库</span>
              </DropdownMenuItem>
              {repo.homepage && (
                <DropdownMenuItem
                  render={
                    <a
                      href={repo.homepage}
                      target="_blank"
                      rel="noreferrer noopener"
                    />
                  }
                >
                  <ExternalLinkIcon />
                  <span>打开主页</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                render={
                  <a
                    href={githubIssuesUrl(repo.owner, repo.name)}
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                <ExternalLinkIcon />
                <span>打开 Issues</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}>
                <CopyIcon />
                <span>复制链接</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderTreeIcon />
                  <span>移至分类</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {repo.category && (
                    <DropdownMenuItem
                      onClick={() => void setRepoCategory(repo.id, null)}
                    >
                      <span>无分类</span>
                    </DropdownMenuItem>
                  )}
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      disabled={category === repo.category}
                      onClick={() => void setRepoCategory(repo.id, category)}
                    >
                      <span>{category}</span>
                    </DropdownMenuItem>
                  ))}
                  {categories.length === 0 && (
                    <DropdownMenuItem disabled>
                      <span>暂无分类</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(repo)}>
                <PencilIcon />
                <span>编辑</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(repo)}
              >
                <Trash2Icon />
                <span>删除</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface RepoTableProps {
  onEdit: (repo: Repo) => void
  onDelete: (repo: Repo) => void
}

export function RepoTable({ onEdit, onDelete }: RepoTableProps) {
  const { visibleRepos, sortKey, reorder, loading } = useRepos()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const dragEnabled = sortKey === "manual"
  const ids = visibleRepos.map((repo) => repo.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    void reorder(arrayMove(ids, oldIndex, newIndex))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (visibleRepos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <InboxIcon className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">没有跟踪的项目</p>
          <p className="text-xs text-muted-foreground">
            点击上方"新建项目"添加一个 GitHub 仓库
          </p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[4.5%]" />
              <TableHead className="w-[4.5%]" />
              <TableHead className="w-[28%] pl-0">仓库</TableHead>
              <TableHead className="w-[9%] text-right">Stars</TableHead>
              <TableHead className="w-[9%] text-right">Forks</TableHead>
              <TableHead className="w-[16%]">Release</TableHead>
              <TableHead className="w-[12%]">最近推送</TableHead>
              <TableHead className="w-[10%]">状态</TableHead>
              <TableHead className="w-[7%] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRepos.map((repo) => (
              <RepoRow
                key={repo.id}
                repo={repo}
                dragEnabled={dragEnabled}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </SortableContext>
    </DndContext>
  )
}
