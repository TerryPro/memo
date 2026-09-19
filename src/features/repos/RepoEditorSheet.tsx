import { useState } from "react"
import { DownloadIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { fetchRepo } from "@/lib/repos"
import { useRepos } from "./ReposContext"
import { STATUS_LABELS, STATUS_OPTIONS, parseRepoInput } from "./repoMeta"
import type { Repo, RepoDraft, RepoStatus } from "./types"

interface RepoEditorSheetProps {
  repo: Repo | null
  open: boolean
  categories: string[]
  existingFullNames: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: RepoDraft) => Promise<void> | void
}

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function numberToInput(value: number | null): string {
  return value === null ? "" : String(value)
}

function parseList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  )
}

export function RepoEditorSheet({
  repo,
  open,
  categories,
  existingFullNames,
  onOpenChange,
  onSubmit,
}: RepoEditorSheetProps) {
  const [owner, setOwner] = useState(repo?.owner ?? "")
  const [name, setName] = useState(repo?.name ?? "")
  const [description, setDescription] = useState(repo?.description ?? "")
  const [homepage, setHomepage] = useState(repo?.homepage ?? "")
  const [language, setLanguage] = useState(repo?.language ?? "")
  const [license, setLicense] = useState(repo?.license ?? "")
  const [topicsInput, setTopicsInput] = useState((repo?.topics ?? []).join(", "))
  const [stars, setStars] = useState(numberToInput(repo?.stars ?? null))
  const [forks, setForks] = useState(numberToInput(repo?.forks ?? null))
  const [watchers, setWatchers] = useState(
    numberToInput(repo?.watchers ?? null)
  )
  const [openIssues, setOpenIssues] = useState(
    numberToInput(repo?.openIssues ?? null)
  )
  const [latestRelease, setLatestRelease] = useState(repo?.latestRelease ?? "")
  const [releaseUrl, setReleaseUrl] = useState(repo?.releaseUrl ?? "")
  const [category, setCategory] = useState(repo?.category ?? "")
  const [tagsInput, setTagsInput] = useState((repo?.tags ?? []).join(", "))
  const [starred, setStarred] = useState(repo?.starred ?? false)
  const [status, setStatus] = useState<RepoStatus>(repo?.status ?? "watching")
  const [notes, setNotes] = useState(repo?.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [importing, setImporting] = useState(false)

  const { settings } = useRepos()

  const isEditing = repo !== null
  const trimmedOwner = owner.trim()
  const trimmedName = name.trim()
  const trimmedFullName = trimmedOwner && trimmedName ? `${trimmedOwner}/${trimmedName}` : ""
  const duplicate =
    trimmedFullName !== "" &&
    existingFullNames.some(
      (item) =>
        item.toLowerCase() === trimmedFullName.toLowerCase() &&
        item.toLowerCase() !== (repo?.fullName.toLowerCase() ?? "")
    )
  const canSubmit = trimmedOwner !== "" && trimmedName !== "" && !duplicate

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSaving(true)
    try {
      await onSubmit({
        owner: trimmedOwner,
        name: trimmedName,
        description: description.trim() ? description.trim() : null,
        homepage: homepage.trim() ? homepage.trim() : null,
        language: language.trim() ? language.trim() : null,
        license: license.trim() ? license.trim() : null,
        topics: parseList(topicsInput),
        stars: toNumberOrNull(stars),
        forks: toNumberOrNull(forks),
        watchers: toNumberOrNull(watchers),
        openIssues: toNumberOrNull(openIssues),
        latestRelease: latestRelease.trim() ? latestRelease.trim() : null,
        releaseUrl: releaseUrl.trim() ? releaseUrl.trim() : null,
        category: category.trim() ? category.trim() : null,
        tags: parseList(tagsInput),
        starred,
        status,
        notes: notes.trim() ? notes.trim() : null,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    const parsed = parseRepoInput(importUrl)
    if (!parsed) {
      toast.error("无法解析 GitHub 地址", {
        description: "请输入 owner/name 或完整链接",
      })
      return
    }

    setImporting(true)
    try {
      setOwner(parsed.owner)
      setName(parsed.name)
      const fetched = await fetchRepo(
        parsed.owner,
        parsed.name,
        settings.githubToken
      )
      setDescription(fetched.description ?? "")
      setHomepage(fetched.homepage ?? "")
      setLanguage(fetched.language ?? "")
      setLicense(fetched.license ?? "")
      setTopicsInput((fetched.topics ?? []).join(", "))
      setStars(fetched.stars != null ? String(fetched.stars) : "")
      setForks(fetched.forks != null ? String(fetched.forks) : "")
      setWatchers(fetched.watchers != null ? String(fetched.watchers) : "")
      setOpenIssues(
        fetched.openIssues != null ? String(fetched.openIssues) : ""
      )
      setLatestRelease(fetched.latestRelease ?? "")
      setReleaseUrl(fetched.releaseUrl ?? "")
      toast.success(`已获取 ${parsed.owner}/${parsed.name} 的信息`)
    } catch (err) {
      toast.error("获取失败", { description: String(err) })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑项目" : "新建项目"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "修改项目信息与个人标记" : "填写 GitHub 仓库信息"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
            <Label htmlFor="repo-import">从 GitHub 链接导入</Label>
            <div className="flex gap-2">
              <Input
                id="repo-import"
                value={importUrl}
                placeholder="https://github.com/vuejs/core"
                autoFocus
                onChange={(event) => setImportUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    void handleImport()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleImport()}
                disabled={importing || !importUrl.trim()}
              >
                {importing ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <DownloadIcon />
                )}
                <span>获取</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              粘贴链接自动解析 owner/name 并填充下方字段
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo-owner">作者/组织</Label>
              <Input
                id="repo-owner"
                value={owner}
                placeholder="例如: vuejs"
                onChange={(event) => setOwner(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo-name">仓库名</Label>
              <Input
                id="repo-name"
                value={name}
                placeholder="例如: core"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          </div>
          {duplicate && (
            <p className="text-xs text-destructive">
              {trimmedFullName} 已存在，请勿重复添加
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-description">简介</Label>
            <Textarea
              id="repo-description"
              value={description}
              rows={3}
              placeholder="项目简介..."
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-homepage">主页</Label>
            <Input
              id="repo-homepage"
              value={homepage}
              placeholder="https://..."
              onChange={(event) => setHomepage(event.target.value)}
            />
          </div>

          <SectionTitle>仓库属性</SectionTitle>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo-language">语言</Label>
              <Input
                id="repo-language"
                value={language}
                placeholder="TypeScript"
                onChange={(event) => setLanguage(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo-license">许可证</Label>
              <Input
                id="repo-license"
                value={license}
                placeholder="MIT"
                onChange={(event) => setLicense(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo-stars">Stars</Label>
              <Input
                id="repo-stars"
                type="number"
                min="0"
                value={stars}
                onChange={(event) => setStars(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo-forks">Forks</Label>
              <Input
                id="repo-forks"
                type="number"
                min="0"
                value={forks}
                onChange={(event) => setForks(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo-watchers">Watchers</Label>
              <Input
                id="repo-watchers"
                type="number"
                min="0"
                value={watchers}
                onChange={(event) => setWatchers(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo-issues">Open Issues</Label>
              <Input
                id="repo-issues"
                type="number"
                min="0"
                value={openIssues}
                onChange={(event) => setOpenIssues(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-topics">主题</Label>
            <Input
              id="repo-topics"
              value={topicsInput}
              placeholder="用逗号分隔,例如:vue,framework"
              onChange={(event) => setTopicsInput(event.target.value)}
            />
          </div>

          <SectionTitle>版本发布</SectionTitle>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-release">最新版本</Label>
            <Input
              id="repo-release"
              value={latestRelease}
              placeholder="例如: v3.4.0"
              onChange={(event) => setLatestRelease(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-release-url">Release 链接</Label>
            <Input
              id="repo-release-url"
              value={releaseUrl}
              placeholder="https://github.com/.../releases/tag/..."
              onChange={(event) => setReleaseUrl(event.target.value)}
            />
          </div>

          <SectionTitle>个人管理</SectionTitle>

          <div className="flex items-center gap-2">
            <Checkbox
              id="repo-starred"
              checked={starred}
              onCheckedChange={(checked) => setStarred(checked === true)}
            />
            <Label htmlFor="repo-starred">标记为重要</Label>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-status">跟进状态</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as RepoStatus)}
              items={STATUS_OPTIONS.map((value) => ({
                value,
                label: STATUS_LABELS[value],
              }))}
            >
              <SelectTrigger id="repo-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-category">分类</Label>
            <Input
              id="repo-category"
              value={category}
              placeholder="例如:UI 框架 / 工具库"
              onChange={(event) => setCategory(event.target.value)}
            />
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categories.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-tags">标签</Label>
            <Input
              id="repo-tags"
              value={tagsInput}
              placeholder="用逗号分隔,例如:重要,待评估"
              onChange={(event) => setTagsInput(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-notes">备注</Label>
            <Textarea
              id="repo-notes"
              value={notes}
              rows={3}
              placeholder="个人备注，一键拉取不会覆盖..."
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
            {isEditing ? "保存" : "创建"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
