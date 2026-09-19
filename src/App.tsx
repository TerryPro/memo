import type { CSSProperties } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LibraryProvider } from "@/features/albums/LibraryProvider"
import { ReposProvider } from "@/features/repos/ReposProvider"
import { TodosProvider } from "@/features/todos/TodosProvider"
import { DashboardPage } from "@/pages/DashboardPage"
import { PhotosLayout } from "@/pages/PhotosLayout"
import { RepoPage } from "@/pages/RepoPage"
import { TodoPage } from "@/pages/TodoPage"
import { AllPhotosView } from "@/pages/photos/AllPhotosView"
import { AlbumDetailView } from "@/pages/photos/AlbumDetailView"

export default function App() {
  return (
    <TooltipProvider>
      <LibraryProvider>
        <TodosProvider>
          <ReposProvider>
            <SidebarProvider
              style={
                {
                  "--sidebar-width": "calc(var(--spacing) * 72)",
                  "--header-height": "calc(var(--spacing) * 12)",
                } as CSSProperties
              }
            >
              <AppSidebar variant="inset" />
              <SidebarInset>
                <SiteHeader />
                <div className="flex min-h-0 flex-1 flex-col">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/photos" element={<PhotosLayout />}>
                      <Route index element={<AllPhotosView />} />
                      <Route
                        path="albums"
                        element={<Navigate to="/photos" replace />}
                      />
                      <Route
                        path="albums/:albumId"
                        element={<AlbumDetailView />}
                      />
                    </Route>
                    <Route path="/todos" element={<TodoPage />} />
                    <Route path="/repos" element={<RepoPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ReposProvider>
        </TodosProvider>
      </LibraryProvider>
    </TooltipProvider>
  )
}
