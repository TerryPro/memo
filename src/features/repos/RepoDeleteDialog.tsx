import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Repo } from "./types"

interface RepoDeleteDialogProps {
  repo: Repo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
}

export function RepoDeleteDialog({
  repo,
  open,
  onOpenChange,
  onConfirm,
}: RepoDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除项目</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除 {repo?.fullName ?? "该项目"} 吗？此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => void onConfirm()}
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
