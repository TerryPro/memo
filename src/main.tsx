import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner.tsx"
import { ExternalLinkGuard } from "./components/external-link-guard.tsx"
import { DebugPanel } from "./components/debug-panel.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <ExternalLinkGuard />
        {import.meta.env.DEV ? <DebugPanel /> : null}
        <main data-ui-scroll-container>
          <App />
        </main>
        <Toaster />
      </ThemeProvider>
    </HashRouter>
  </StrictMode>
)
