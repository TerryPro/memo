import { useState } from "react"
import { zhCN } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import {
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  formatDueDate,
  parseISODate,
  toISODate,
} from "./priority"
import type { Todo, TodoDraft, TodoPriority } from "./types"

interface TodoEditorSheetProps {
  todo: Todo | null
  open: boolean
  categories: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: TodoDraft) => Promise<void> | void
}

export function TodoEditorSheet({
  todo,
  open,
  categories,
  onOpenChange,
  onSubmit,
}: TodoEditorSheetProps) {
  const [title, setTitle] = useState(todo?.title ?? "")
  const [notes, setNotes] = useState(todo?.notes ?? "")
  const [priority, setPriority] = useState<TodoPriority>(
    todo?.priority ?? "none"
  )
  const [dueDate, setDueDate] = useState<string | null>(todo?.dueDate ?? null)
  const [category, setCategory] = useState(todo?.category ?? "")
  const [tagsInput, setTagsInput] = useState((todo?.tags ?? []).join(", "))
  const [dateOpen, setDateOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEditing = todo !== null
  const trimmedTitle = title.trim()

  const handleSubmit = async () => {
    if (!trimmedTitle) return

    setSaving(true)
    try {
      const tags = Array.from(
        new Set(
          tagsInput
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        )
      )

      await onSubmit({
        title: trimmedTitle,
        notes: notes.trim() ? notes.trim() : null,
        priority,
        dueDate,
        category: category.trim() ? category.trim() : null,
        tags,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑待办" : "新建待办"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "修改待办内容与属性" : "填写待办内容与属性"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-title">标题</Label>
            <Input
              id="todo-title"
              value={title}
              placeholder="待办标题"
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-notes">备注</Label>
            <Textarea
              id="todo-notes"
              value={notes}
              rows={4}
              placeholder="添加详细说明..."
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-priority">优先级</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as TodoPriority)}
              items={PRIORITY_OPTIONS.map((value) => ({
                value,
                label: PRIORITY_LABELS[value],
              }))}
            >
              <SelectTrigger id="todo-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PRIORITY_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PRIORITY_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>截止日期</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  />
                }
              >
                <CalendarIcon />
                <span>{dueDate ? formatDueDate(dueDate) : "选择截止日期"}</span>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate ? parseISODate(dueDate) : undefined}
                  onSelect={(date) => {
                    setDueDate(date ? toISODate(date) : null)
                    setDateOpen(false)
                  }}
                  locale={zhCN}
                />
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setDueDate(null)
                      setDateOpen(false)
                    }}
                  >
                    清除日期
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-category">分类</Label>
            <Input
              id="todo-category"
              value={category}
              placeholder="例如:工作 / 生活"
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
            <Label htmlFor="todo-tags">标签</Label>
            <Input
              id="todo-tags"
              value={tagsInput}
              placeholder="用逗号分隔,例如:重要,紧急"
              onChange={(event) => setTagsInput(event.target.value)}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !trimmedTitle}>
            {isEditing ? "保存" : "创建"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
